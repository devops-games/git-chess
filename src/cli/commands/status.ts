import chalk from 'chalk';
import path from 'path';
import { GameManager } from '../../game/manager.js';
import { Board } from '../../chess/board.js';
import { MoveValidator } from '../../chess/moves.js';

interface StatusOptions {
  game?: string;
  verbose?: boolean;
}

export async function showStatus(options: StatusOptions): Promise<void> {
  if (!options.game) {
    console.error(chalk.red('Error: Game ID is required. Use --game flag or set GITCHESS_GAME environment variable'));
    process.exit(1);
  }

  const gameDir = path.join('games', options.game);
  const manager = new GameManager(gameDir);
  
  try {
    const config = await manager.loadConfig();
    const state = await manager.loadState();
    const moves = await manager.loadMoves();
    
    console.log(chalk.bold(`\nGame ${config.id}\n`));
    console.log(`${chalk.white.bold('White:')} ${config.white}`);
    console.log(`${chalk.gray.bold('Black:')} ${config.black}`);
    console.log();
    
    const statusColour = state.status === 'active' ? chalk.green : chalk.yellow;
    console.log(`${chalk.bold('Status:')} ${statusColour(state.status)}`);
    
    if (state.result) {
      const resultText = state.result === '1-0' ? 'White wins' :
                        state.result === '0-1' ? 'Black wins' : 'Draw';
      console.log(`${chalk.bold('Result:')} ${resultText}`);
    }
    
    console.log(`${chalk.bold('Move:')} ${state.moveNumber}`);
    console.log(`${chalk.bold('Turn:')} ${state.turn === 'white' ? chalk.white('White') : chalk.gray('Black')}`);
    console.log(`${chalk.bold('Time Control:')} ${config.timeControl.type}`);
    
    if (state.lastMoveAt) {
      const lastMove = new Date(state.lastMoveAt);
      const timeAgo = getTimeAgo(lastMove);
      console.log(`${chalk.bold('Last Move:')} ${timeAgo}`);
    }
    
    const position = Board.fromFEN(state.currentFEN);
    
    if (MoveValidator.isInCheck(position, position.turn)) {
      console.log(chalk.yellow.bold('\n⚠️  Check!'));
    }
    
    if (options.verbose) {
      console.log(chalk.bold('\nFEN:'));
      console.log(state.currentFEN);
      
      console.log(chalk.bold('\nCastling Rights:'));
      console.log(`White: K=${position.castlingRights.white.kingside ? '✓' : '✗'} Q=${position.castlingRights.white.queenside ? '✓' : '✗'}`);
      console.log(`Black: K=${position.castlingRights.black.kingside ? '✓' : '✗'} Q=${position.castlingRights.black.queenside ? '✓' : '✗'}`);
      
      if (position.enPassantTarget) {
        console.log(`${chalk.bold('En Passant:')} ${position.enPassantTarget}`);
      }
      
      console.log(`${chalk.bold('Half-move clock:')} ${position.halfMoveClock}`);
      
      if (moves.length > 0) {
        console.log(chalk.bold('\nLast 5 moves:'));
        const recentMoves = moves.slice(-5);
        for (const move of recentMoves) {
          const moveNum = Math.floor(moves.indexOf(move) / 2) + 1;
          const colour = moves.indexOf(move) % 2 === 0 ? 'White' : 'Black';
          console.log(`  ${moveNum}. ${colour}: ${move.notation || `${move.from}-${move.to}`}`);
        }
      }
      
      const legalMoves = MoveValidator.getAllLegalMoves(position);
      console.log(`${chalk.bold('\nLegal moves:')} ${legalMoves.length}`);
      
      if (legalMoves.length === 0 && state.status === 'active') {
        if (MoveValidator.isInCheck(position, position.turn)) {
          console.log(chalk.red.bold('Checkmate!'));
        } else {
          console.log(chalk.yellow.bold('Stalemate!'));
        }
      }
    }
    
  } catch (error) {
    console.error(chalk.red('Error loading game:'), (error as Error).message);
    process.exit(1);
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}