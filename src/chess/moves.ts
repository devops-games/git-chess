import { Position, Move, Square, Piece, Colour, PieceType } from './types.js';
import { Board } from './board.js';

export class MoveValidator {
  static isValidMove(position: Position, move: Move): boolean {
    const piece = Board.getPiece(position, move.from);
    
    if (!piece) return false;
    if (piece.colour !== position.turn) return false;
    
    const targetPiece = Board.getPiece(position, move.to);
    if (targetPiece && targetPiece.colour === piece.colour) return false;
    
    if (!this.isPseudoLegal(position, move, piece)) return false;
    
    const testPosition = this.makeMove(position, move);
    if (this.isInCheck(testPosition, piece.colour)) return false;
    
    return true;
  }

  static getAllLegalMoves(position: Position): Move[] {
    const moves: Move[] = [];
    const colour = position.turn;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = Board.indicesToSquare(row, col);
        const piece = Board.getPiece(position, square);
        
        if (piece && piece.colour === colour) {
          const pieceMoves = this.getPieceMoves(position, square, piece);
          moves.push(...pieceMoves);
        }
      }
    }
    
    return moves.filter(move => this.isValidMove(position, move));
  }

  private static isPseudoLegal(position: Position, move: Move, piece: Piece): boolean {
    switch (piece.type) {
      case 'pawn':
        return this.isPawnMoveLegal(position, move, piece);
      case 'knight':
        return this.isKnightMoveLegal(move);
      case 'bishop':
        return this.isBishopMoveLegal(position, move);
      case 'rook':
        return this.isRookMoveLegal(position, move);
      case 'queen':
        return this.isQueenMoveLegal(position, move);
      case 'king':
        return this.isKingMoveLegal(position, move, piece);
      default:
        return false;
    }
  }

  private static isPawnMoveLegal(position: Position, move: Move, piece: Piece): boolean {
    const [fromRow, fromCol] = Board.squareToIndices(move.from);
    const [toRow, toCol] = Board.squareToIndices(move.to);
    
    const direction = piece.colour === 'white' ? 1 : -1;
    const startRow = piece.colour === 'white' ? 1 : 6;
    
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);
    
    if (colDiff === 0) {
      if (rowDiff === direction) {
        return Board.getPiece(position, move.to) === null;
      }
      if (fromRow === startRow && rowDiff === 2 * direction) {
        const middleSquare = Board.indicesToSquare(fromRow + direction, fromCol);
        return Board.getPiece(position, move.to) === null && 
               Board.getPiece(position, middleSquare) === null;
      }
    } else if (colDiff === 1 && rowDiff === direction) {
      const targetPiece = Board.getPiece(position, move.to);
      if (targetPiece && targetPiece.colour !== piece.colour) {
        return true;
      }
      if (move.to === position.enPassantTarget) {
        return true;
      }
    }
    
    return false;
  }

  private static isKnightMoveLegal(move: Move): boolean {
    const [fromRow, fromCol] = Board.squareToIndices(move.from);
    const [toRow, toCol] = Board.squareToIndices(move.to);
    
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  private static isBishopMoveLegal(position: Position, move: Move): boolean {
    const [fromRow, fromCol] = Board.squareToIndices(move.from);
    const [toRow, toCol] = Board.squareToIndices(move.to);
    
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (rowDiff !== colDiff) return false;
    
    return this.isPathClear(position, fromRow, fromCol, toRow, toCol);
  }

  private static isRookMoveLegal(position: Position, move: Move): boolean {
    const [fromRow, fromCol] = Board.squareToIndices(move.from);
    const [toRow, toCol] = Board.squareToIndices(move.to);
    
    if (fromRow !== toRow && fromCol !== toCol) return false;
    
    return this.isPathClear(position, fromRow, fromCol, toRow, toCol);
  }

  private static isQueenMoveLegal(position: Position, move: Move): boolean {
    return this.isBishopMoveLegal(position, move) || this.isRookMoveLegal(position, move);
  }

  private static isKingMoveLegal(position: Position, move: Move, piece: Piece): boolean {
    const [fromRow, fromCol] = Board.squareToIndices(move.from);
    const [toRow, toCol] = Board.squareToIndices(move.to);
    
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    if (rowDiff <= 1 && colDiff <= 1) {
      return true;
    }
    
    if (rowDiff === 0 && colDiff === 2) {
      return this.isCastlingLegal(position, move, piece);
    }
    
    return false;
  }

  private static isCastlingLegal(position: Position, move: Move, piece: Piece): boolean {
    if (this.isInCheck(position, piece.colour)) return false;
    
    const [, fromCol] = Board.squareToIndices(move.from);
    const [, toCol] = Board.squareToIndices(move.to);
    
    const isKingside = toCol > fromCol;
    const castlingRights = position.castlingRights[piece.colour];
    
    if (isKingside && !castlingRights.kingside) return false;
    if (!isKingside && !castlingRights.queenside) return false;
    
    const row = piece.colour === 'white' ? 0 : 7;
    const startCol = 4;
    const endCol = isKingside ? 7 : 0;
    const direction = isKingside ? 1 : -1;
    
    for (let col = startCol + direction; col !== endCol; col += direction) {
      const square = Board.indicesToSquare(row, col);
      if (Board.getPiece(position, square) !== null) return false;
    }
    
    for (let col = startCol; col !== toCol + direction; col += direction) {
      const testPosition = { ...position };
      const testSquare = Board.indicesToSquare(row, col);
      Board.setPiece(testPosition, move.from, null);
      Board.setPiece(testPosition, testSquare, piece);
      if (this.isInCheck(testPosition, piece.colour)) return false;
    }
    
    return true;
  }

  private static isPathClear(position: Position, fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
    
    let row = fromRow + rowStep;
    let col = fromCol + colStep;
    
    while (row !== toRow || col !== toCol) {
      const square = Board.indicesToSquare(row, col);
      if (Board.getPiece(position, square) !== null) return false;
      row += rowStep;
      col += colStep;
    }
    
    return true;
  }

  private static getPieceMoves(position: Position, from: Square, piece: Piece): Move[] {
    const moves: Move[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const to = Board.indicesToSquare(row, col);
        const move: Move = {
          from,
          to,
          piece: piece.type
        };
        
        const targetPiece = Board.getPiece(position, to);
        if (targetPiece) {
          move.capture = targetPiece.type;
        }
        
        moves.push(move);
      }
    }
    
    return moves;
  }

  static makeMove(position: Position, move: Move): Position {
    const newPosition: Position = JSON.parse(JSON.stringify(position));
    
    const piece = Board.getPiece(newPosition, move.from);
    if (!piece) throw new Error('No piece at source square');
    
    Board.setPiece(newPosition, move.from, null);
    Board.setPiece(newPosition, move.to, move.promotion ? { ...piece, type: move.promotion } : piece);
    
    if (move.castling) {
      const row = piece.colour === 'white' ? 0 : 7;
      if (move.castling === 'kingside') {
        const rook = Board.getPiece(newPosition, Board.indicesToSquare(row, 7));
        Board.setPiece(newPosition, Board.indicesToSquare(row, 7), null);
        Board.setPiece(newPosition, Board.indicesToSquare(row, 5), rook);
      } else {
        const rook = Board.getPiece(newPosition, Board.indicesToSquare(row, 0));
        Board.setPiece(newPosition, Board.indicesToSquare(row, 0), null);
        Board.setPiece(newPosition, Board.indicesToSquare(row, 3), rook);
      }
    }
    
    if (move.enPassant) {
      const [toRow, toCol] = Board.squareToIndices(move.to);
      const captureRow = piece.colour === 'white' ? toRow - 1 : toRow + 1;
      Board.setPiece(newPosition, Board.indicesToSquare(captureRow, toCol), null);
    }
    
    newPosition.turn = newPosition.turn === 'white' ? 'black' : 'white';
    
    if (piece.type === 'pawn' && Math.abs(Board.squareToIndices(move.from)[0] - Board.squareToIndices(move.to)[0]) === 2) {
      const [fromRow, fromCol] = Board.squareToIndices(move.from);
      const [toRow] = Board.squareToIndices(move.to);
      const enPassantRow = (fromRow + toRow) / 2;
      newPosition.enPassantTarget = Board.indicesToSquare(enPassantRow, fromCol);
    } else {
      newPosition.enPassantTarget = null;
    }
    
    if (piece.type === 'king') {
      if (piece.colour === 'white') {
        newPosition.castlingRights.white.kingside = false;
        newPosition.castlingRights.white.queenside = false;
      } else {
        newPosition.castlingRights.black.kingside = false;
        newPosition.castlingRights.black.queenside = false;
      }
    }
    
    if (piece.type === 'rook') {
      const [fromRow, fromCol] = Board.squareToIndices(move.from);
      if (piece.colour === 'white' && fromRow === 0) {
        if (fromCol === 0) newPosition.castlingRights.white.queenside = false;
        if (fromCol === 7) newPosition.castlingRights.white.kingside = false;
      } else if (piece.colour === 'black' && fromRow === 7) {
        if (fromCol === 0) newPosition.castlingRights.black.queenside = false;
        if (fromCol === 7) newPosition.castlingRights.black.kingside = false;
      }
    }
    
    if (move.capture || piece.type === 'pawn') {
      newPosition.halfMoveClock = 0;
    } else {
      newPosition.halfMoveClock++;
    }
    
    if (piece.colour === 'black') {
      newPosition.fullMoveNumber++;
    }
    
    return newPosition;
  }

  static isInCheck(position: Position, colour: Colour): boolean {
    let kingSquare: Square | null = null;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = Board.indicesToSquare(row, col);
        const piece = Board.getPiece(position, square);
        if (piece && piece.type === 'king' && piece.colour === colour) {
          kingSquare = square;
          break;
        }
      }
      if (kingSquare) break;
    }
    
    if (!kingSquare) return false;
    
    const testPosition = { ...position, turn: colour === 'white' ? 'black' : 'white' as Colour };
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = Board.indicesToSquare(row, col);
        const piece = Board.getPiece(position, square);
        
        if (piece && piece.colour !== colour) {
          const move: Move = {
            from: square,
            to: kingSquare,
            piece: piece.type
          };
          
          if (this.isPseudoLegal(testPosition, move, piece)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  static isCheckmate(position: Position): boolean {
    return this.isInCheck(position, position.turn) && this.getAllLegalMoves(position).length === 0;
  }

  static isStalemate(position: Position): boolean {
    return !this.isInCheck(position, position.turn) && this.getAllLegalMoves(position).length === 0;
  }

  static parseMove(moveStr: string): { from: Square; to: Square; promotion?: PieceType } {
    const match = moveStr.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);
    if (!match) {
      throw new Error(`Invalid move format: ${moveStr}`);
    }
    
    const promotionMap: Record<string, PieceType> = {
      'q': 'queen',
      'r': 'rook',
      'b': 'bishop',
      'n': 'knight'
    };
    
    return {
      from: match[1] as Square,
      to: match[2] as Square,
      promotion: match[3] ? promotionMap[match[3]] : undefined
    };
  }

  static toAlgebraicNotation(position: Position, move: Move): string {
    const piece = Board.getPiece(position, move.from);
    if (!piece) return '';
    
    let notation = '';
    
    if (move.castling === 'kingside') return 'O-O';
    if (move.castling === 'queenside') return 'O-O-O';
    
    if (piece.type !== 'pawn') {
      const pieceChar = piece.type[0].toUpperCase();
      notation += pieceChar === 'K' && piece.type === 'knight' ? 'N' : pieceChar;
      
      const disambiguate = this.needsDisambiguation(position, move, piece);
      if (disambiguate.file) notation += move.from[0];
      if (disambiguate.rank) notation += move.from[1];
    } else if (move.capture) {
      notation += move.from[0];
    }
    
    if (move.capture) notation += 'x';
    
    notation += move.to;
    
    if (move.promotion) {
      const promotionChar = move.promotion[0].toUpperCase();
      notation += '=' + (promotionChar === 'K' ? 'N' : promotionChar);
    }
    
    const resultPosition = this.makeMove(position, move);
    if (this.isCheckmate(resultPosition)) {
      notation += '#';
    } else if (this.isInCheck(resultPosition, resultPosition.turn)) {
      notation += '+';
    }
    
    return notation;
  }

  private static needsDisambiguation(position: Position, move: Move, piece: Piece): { file: boolean; rank: boolean } {
    const otherPieces: Square[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = Board.indicesToSquare(row, col);
        if (square === move.from) continue;
        
        const otherPiece = Board.getPiece(position, square);
        if (otherPiece && otherPiece.type === piece.type && otherPiece.colour === piece.colour) {
          const testMove: Move = { ...move, from: square };
          if (this.isPseudoLegal(position, testMove, otherPiece)) {
            otherPieces.push(square);
          }
        }
      }
    }
    
    if (otherPieces.length === 0) return { file: false, rank: false };
    
    const sameFile = otherPieces.some(sq => sq[0] === move.from[0]);
    const sameRank = otherPieces.some(sq => sq[1] === move.from[1]);
    
    return {
      file: !sameFile || (sameFile && sameRank),
      rank: sameRank
    };
  }
}