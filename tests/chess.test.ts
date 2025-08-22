import { Board } from '../src/chess/board';
import { MoveValidator } from '../src/chess/moves';
import type { Move } from '../src/chess/types';

describe('Chess Engine', () => {
  describe('Board', () => {
    test('should create initial position', () => {
      const position = Board.createInitialPosition();
      expect(position.turn).toBe('white');
      expect(position.fullMoveNumber).toBe(1);
      expect(position.halfMoveClock).toBe(0);
    });

    test('should parse FEN correctly', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const position = Board.fromFEN(fen);
      expect(Board.toFEN(position)).toBe(fen);
    });

    test('should get piece at square', () => {
      const position = Board.createInitialPosition();
      const piece = Board.getPiece(position, 'e1');
      expect(piece).toEqual({ type: 'king', colour: 'white' });
    });
  });

  describe('MoveValidator', () => {
    test('should validate pawn moves', () => {
      const position = Board.createInitialPosition();
      const move: Move = {
        from: 'e2',
        to: 'e4',
        piece: 'pawn'
      };
      expect(MoveValidator.isValidMove(position, move)).toBe(true);
    });

    test('should reject invalid pawn moves', () => {
      const position = Board.createInitialPosition();
      const move: Move = {
        from: 'e2',
        to: 'e5',
        piece: 'pawn'
      };
      expect(MoveValidator.isValidMove(position, move)).toBe(false);
    });

    test('should validate knight moves', () => {
      const position = Board.createInitialPosition();
      const move: Move = {
        from: 'b1',
        to: 'c3',
        piece: 'knight'
      };
      expect(MoveValidator.isValidMove(position, move)).toBe(true);
    });

    test('should detect check', () => {
      const fen = 'rnbqk1nr/pppp1ppp/8/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      const position = Board.fromFEN(fen);
      const move: Move = {
        from: 'c5',
        to: 'f2',
        piece: 'bishop'
      };
      position.turn = 'black';
      const newPosition = MoveValidator.makeMove(position, move);
      expect(MoveValidator.isInCheck(newPosition, 'white')).toBe(true);
    });

    test('should detect checkmate', () => {
      const fen = 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR b KQkq - 0 4';
      const position = Board.fromFEN(fen);
      const move: Move = {
        from: 'f3',
        to: 'f7',
        piece: 'queen',
        capture: 'pawn'
      };
      position.turn = 'white';
      const newPosition = MoveValidator.makeMove(position, move);
      expect(MoveValidator.isCheckmate(newPosition)).toBe(true);
    });

    test('should handle castling', () => {
      const fen = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1';
      const position = Board.fromFEN(fen);
      const move: Move = {
        from: 'e1',
        to: 'g1',
        piece: 'king'
      };
      expect(MoveValidator.isValidMove(position, move)).toBe(true);
    });

    test('should handle en passant', () => {
      const fen = 'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3';
      const position = Board.fromFEN(fen);
      const move: Move = {
        from: 'e5',
        to: 'd6',
        piece: 'pawn',
        enPassant: true
      };
      expect(MoveValidator.isValidMove(position, move)).toBe(true);
    });

    test('should generate algebraic notation', () => {
      const position = Board.createInitialPosition();
      const move: Move = {
        from: 'e2',
        to: 'e4',
        piece: 'pawn'
      };
      const notation = MoveValidator.toAlgebraicNotation(position, move);
      expect(notation).toBe('e4');
    });

    test('should parse move string', () => {
      const parsed = MoveValidator.parseMove('e2e4');
      expect(parsed).toEqual({
        from: 'e2',
        to: 'e4',
        promotion: undefined
      });
    });

    test('should parse promotion move', () => {
      const parsed = MoveValidator.parseMove('e7e8q');
      expect(parsed).toEqual({
        from: 'e7',
        to: 'e8',
        promotion: 'queen'
      });
    });
  });
});