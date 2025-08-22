export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type Colour = 'white' | 'black';
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type Square = `${File}${Rank}`;

export interface Piece {
  type: PieceType;
  colour: Colour;
}

export interface Move {
  from: Square;
  to: Square;
  piece: PieceType;
  capture?: PieceType;
  promotion?: PieceType;
  castling?: 'kingside' | 'queenside';
  enPassant?: boolean;
  check?: boolean;
  checkmate?: boolean;
  stalemate?: boolean;
  notation?: string;
}

export interface Position {
  board: (Piece | null)[][];
  turn: Colour;
  castlingRights: {
    white: { kingside: boolean; queenside: boolean };
    black: { kingside: boolean; queenside: boolean };
  };
  enPassantTarget: Square | null;
  halfMoveClock: number;
  fullMoveNumber: number;
}

export interface GameState {
  id: string;
  white: string;
  black: string;
  currentPosition: Position;
  moves: Move[];
  status: 'waiting' | 'active' | 'finished';
  result?: '1-0' | '0-1' | '1/2-1/2';
  timeControl: TimeControl;
  startedAt?: string;
  lastMoveAt?: string;
}

export interface TimeControl {
  type: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'correspondence';
  initial: number;
  increment: number;
}

export interface GameConfig {
  id: string;
  white: string;
  black: string;
  timeControl: TimeControl;
  variant?: 'standard' | 'chess960';
  startingFEN?: string;
}