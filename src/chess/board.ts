import { Piece, Position, Square, File, Rank, Colour, PieceType } from './types.js';

export class Board {
  private static readonly INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  private static readonly FILES: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  private static readonly RANKS: Rank[] = ['1', '2', '3', '4', '5', '6', '7', '8'];

  static createInitialPosition(): Position {
    return Board.fromFEN(Board.INITIAL_FEN);
  }

  static fromFEN(fen: string): Position {
    const parts = fen.split(' ');
    const [boardStr, turn, castling, enPassant, halfMove, fullMove] = parts;

    const board: (Piece | null)[][] = [];
    const rows = boardStr.split('/').reverse();
    
    for (const row of rows) {
      const boardRow: (Piece | null)[] = [];
      for (const char of row) {
        if (char >= '1' && char <= '8') {
          const emptySquares = parseInt(char);
          for (let i = 0; i < emptySquares; i++) {
            boardRow.push(null);
          }
        } else {
          boardRow.push(Board.pieceFromChar(char));
        }
      }
      board.push(boardRow);
    }

    return {
      board,
      turn: turn === 'w' ? 'white' : 'black',
      castlingRights: {
        white: {
          kingside: castling.includes('K'),
          queenside: castling.includes('Q')
        },
        black: {
          kingside: castling.includes('k'),
          queenside: castling.includes('q')
        }
      },
      enPassantTarget: enPassant === '-' ? null : enPassant as Square,
      halfMoveClock: parseInt(halfMove),
      fullMoveNumber: parseInt(fullMove)
    };
  }

  static toFEN(position: Position): string {
    const boardStr = position.board.slice().reverse().map(row => {
      let rowStr = '';
      let emptyCount = 0;
      
      for (const piece of row) {
        if (piece === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rowStr += emptyCount;
            emptyCount = 0;
          }
          rowStr += Board.charFromPiece(piece);
        }
      }
      
      if (emptyCount > 0) {
        rowStr += emptyCount;
      }
      
      return rowStr;
    }).join('/');

    const turn = position.turn === 'white' ? 'w' : 'b';
    
    let castling = '';
    if (position.castlingRights.white.kingside) castling += 'K';
    if (position.castlingRights.white.queenside) castling += 'Q';
    if (position.castlingRights.black.kingside) castling += 'k';
    if (position.castlingRights.black.queenside) castling += 'q';
    if (castling === '') castling = '-';

    const enPassant = position.enPassantTarget || '-';
    
    return `${boardStr} ${turn} ${castling} ${enPassant} ${position.halfMoveClock} ${position.fullMoveNumber}`;
  }

  static squareToIndices(square: Square): [number, number] {
    const file = square[0] as File;
    const rank = square[1] as Rank;
    const fileIndex = Board.FILES.indexOf(file);
    const rankIndex = Board.RANKS.indexOf(rank);
    return [rankIndex, fileIndex];
  }

  static indicesToSquare(row: number, col: number): Square {
    return `${Board.FILES[col]}${Board.RANKS[row]}` as Square;
  }

  static getPiece(position: Position, square: Square): Piece | null {
    const [row, col] = Board.squareToIndices(square);
    return position.board[row][col];
  }

  static setPiece(position: Position, square: Square, piece: Piece | null): void {
    const [row, col] = Board.squareToIndices(square);
    position.board[row][col] = piece;
  }

  private static pieceFromChar(char: string): Piece {
    const colour: Colour = char === char.toUpperCase() ? 'white' : 'black';
    const typeMap: Record<string, PieceType> = {
      'p': 'pawn',
      'n': 'knight',
      'b': 'bishop',
      'r': 'rook',
      'q': 'queen',
      'k': 'king'
    };
    
    return {
      type: typeMap[char.toLowerCase()],
      colour
    };
  }

  private static charFromPiece(piece: Piece): string {
    const charMap: Record<PieceType, string> = {
      'pawn': 'p',
      'knight': 'n',
      'bishop': 'b',
      'rook': 'r',
      'queen': 'q',
      'king': 'k'
    };
    
    const char = charMap[piece.type];
    return piece.colour === 'white' ? char.toUpperCase() : char;
  }
}