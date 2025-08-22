import chalk from 'chalk';
import path from 'path';
import { GameManager } from '../../game/manager.js';
import { Board } from '../../chess/board.js';
import type { Piece } from '../../chess/types.js';

interface BoardOptions {
  game?: string;
  fen?: boolean;
  ascii?: boolean;
}

export async function showBoard(options: BoardOptions): Promise<void> {
  if (!options.game) {
    console.error(chalk.red('Error: Game ID is required. Use --game flag or set GITCHESS_GAME environment variable'));
    process.exit(1);
  }

  const gameDir = path.join('games', options.game);
  const manager = new GameManager(gameDir);
  
  try {
    const state = await manager.loadState();
    
    if (options.fen) {
      console.log(state.currentFEN);
      return;
    }

    const position = Board.fromFEN(state.currentFEN);
    displayBoard(position.board, options.ascii || false);
    
    console.log();
    console.log(chalk.blue('Turn:'), state.turn === 'white' ? chalk.white('White') : chalk.gray('Black'));
    console.log(chalk.blue('Move:'), state.moveNumber);
    
  } catch (error) {
    console.error(chalk.red('Error loading game:'), (error as Error).message);
    process.exit(1);
  }
}

function displayBoard(board: (Piece | null)[][], ascii: boolean): void {
  const pieces = ascii ? {
    'white': {
      'king': 'K',
      'queen': 'Q',
      'rook': 'R',
      'bishop': 'B',
      'knight': 'N',
      'pawn': 'P'
    },
    'black': {
      'king': 'k',
      'queen': 'q',
      'rook': 'r',
      'bishop': 'b',
      'knight': 'n',
      'pawn': 'p'
    }
  } : {
    'white': {
      'king': '♔',
      'queen': '♕',
      'rook': '♖',
      'bishop': '♗',
      'knight': '♘',
      'pawn': '♙'
    },
    'black': {
      'king': '♚',
      'queen': '♛',
      'rook': '♜',
      'bishop': '♝',
      'knight': '♞',
      'pawn': '♟'
    }
  };

  console.log('\n  ┌─────────────────┐');
  
  for (let rank = 7; rank >= 0; rank--) {
    let line = `${rank + 1} │ `;
    
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      
      if (piece) {
        const symbol = pieces[piece.colour][piece.type];
        if (piece.colour === 'white') {
          line += chalk.white(symbol) + ' ';
        } else {
          line += chalk.gray(symbol) + ' ';
        }
      } else {
        const isDark = (rank + file) % 2 === 0;
        line += (isDark ? chalk.gray('·') : '·') + ' ';
      }
    }
    
    line += '│';
    console.log(line);
  }
  
  console.log('  └─────────────────┘');
  console.log('    a b c d e f g h');
}