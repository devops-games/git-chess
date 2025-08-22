import chalk from 'chalk';
import path from 'path';
import { GameManager } from '../../game/manager.js';
import { Board } from '../../chess/board.js';
import { MoveValidator } from '../../chess/moves.js';
import type { Square } from '../../chess/types.js';

interface ValidateOptions {
  game?: string;
}

export async function validateMove(from: string, to: string, options: ValidateOptions): Promise<void> {
  if (!options.game) {
    console.error(chalk.red('Error: Game ID is required. Use --game flag or set GITCHESS_GAME environment variable'));
    process.exit(1);
  }

  const gameDir = path.join('games', options.game);
  const manager = new GameManager(gameDir);
  
  try {
    const state = await manager.loadState();
    const position = Board.fromFEN(state.currentFEN);
    
    const piece = Board.getPiece(position, from as Square);
    
    if (!piece) {
      console.log(chalk.red(`✗ No piece at ${from}`));
      process.exit(1);
    }
    
    console.log(chalk.blue(`Piece at ${from}:`), `${piece.colour} ${piece.type}`);
    
    if (piece.colour !== position.turn) {
      console.log(chalk.red(`✗ It's ${position.turn}'s turn, but the piece is ${piece.colour}`));
      process.exit(1);
    }
    
    const targetPiece = Board.getPiece(position, to as Square);
    if (targetPiece) {
      if (targetPiece.colour === piece.colour) {
        console.log(chalk.red(`✗ Cannot capture your own piece at ${to}`));
        process.exit(1);
      }
      console.log(chalk.blue(`Target square ${to}:`), `${targetPiece.colour} ${targetPiece.type}`);
    } else {
      console.log(chalk.blue(`Target square ${to}:`), 'empty');
    }
    
    const parsedMove = MoveValidator.parseMove(from + to);
    const move = {
      from: parsedMove.from,
      to: parsedMove.to,
      piece: piece.type,
      promotion: parsedMove.promotion
    };
    
    if (MoveValidator.isValidMove(position, move)) {
      console.log(chalk.green(`✓ Move ${from} to ${to} is valid`));
      
      const newPosition = MoveValidator.makeMove(position, move);
      const notation = MoveValidator.toAlgebraicNotation(position, move);
      
      console.log(chalk.blue('Algebraic notation:'), notation);
      
      if (MoveValidator.isInCheck(newPosition, newPosition.turn)) {
        console.log(chalk.yellow('This move would put the opponent in check!'));
      }
      
      if (MoveValidator.isCheckmate(newPosition)) {
        console.log(chalk.green.bold('This move would be checkmate!'));
      }
      
      if (MoveValidator.isStalemate(newPosition)) {
        console.log(chalk.yellow.bold('This move would result in stalemate!'));
      }
    } else {
      console.log(chalk.red(`✗ Move ${from} to ${to} is not valid`));
      
      console.log(chalk.yellow('\nPossible reasons:'));
      
      const testPosition = { ...position };
      Board.setPiece(testPosition, from as Square, null);
      Board.setPiece(testPosition, to as Square, piece);
      
      if (MoveValidator.isInCheck(testPosition, piece.colour)) {
        console.log('  • This move would leave your king in check');
      }
      
      switch (piece.type) {
        case 'pawn':
          console.log('  • Pawns move forward one square (two from starting position)');
          console.log('  • Pawns capture diagonally');
          break;
        case 'knight':
          console.log('  • Knights move in an L-shape (2 squares + 1 square perpendicular)');
          break;
        case 'bishop':
          console.log('  • Bishops move diagonally');
          console.log('  • Path must be clear');
          break;
        case 'rook':
          console.log('  • Rooks move horizontally or vertically');
          console.log('  • Path must be clear');
          break;
        case 'queen':
          console.log('  • Queens move horizontally, vertically, or diagonally');
          console.log('  • Path must be clear');
          break;
        case 'king':
          console.log('  • Kings move one square in any direction');
          console.log('  • Cannot move into check');
          console.log('  • Castling requires specific conditions');
          break;
      }
      
      const legalMoves = MoveValidator.getAllLegalMoves(position)
        .filter(m => m.from === from as Square)
        .map(m => m.to);
      
      if (legalMoves.length > 0) {
        console.log(chalk.blue(`\nLegal moves from ${from}:`), legalMoves.join(', '));
      } else {
        console.log(chalk.yellow(`\nNo legal moves from ${from}`));
      }
    }
    
  } catch (error) {
    console.error(chalk.red('Error validating move:'), (error as Error).message);
    process.exit(1);
  }
}