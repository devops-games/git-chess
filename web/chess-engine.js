// Chess Engine - Core chess logic and rules

class ChessEngine {
    constructor() {
        this.board = this.createInitialBoard();
        this.turn = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
    }

    createInitialBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Set up pawns
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'white' };
            board[6][i] = { type: 'pawn', color: 'black' };
        }

        // Set up other pieces
        const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let i = 0; i < 8; i++) {
            board[0][i] = { type: backRow[i], color: 'white' };
            board[7][i] = { type: backRow[i], color: 'black' };
        }

        return board;
    }

    getPiece(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;
        return this.board[row][col];
    }

    setPiece(row, col, piece) {
        if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
            this.board[row][col] = piece;
        }
    }

    squareToCoords(square) {
        const file = square.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
        const rank = parseInt(square[1]) - 1;
        return [rank, file];
    }

    coordsToSquare(row, col) {
        return String.fromCharCode(97 + col) + (row + 1);
    }

    getValidMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece || piece.color !== this.turn) return [];

        let moves = [];

        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(row, col, piece.color);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col, piece.color);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col, piece.color);
                break;
            case 'rook':
                moves = this.getRookMoves(row, col, piece.color);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col, piece.color);
                break;
            case 'king':
                moves = this.getKingMoves(row, col, piece.color);
                break;
        }

        // Filter out moves that would leave king in check
        return moves.filter(move => !this.wouldBeInCheck(row, col, move[0], move[1], piece.color));
    }

    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? 1 : -1;
        const startRow = color === 'white' ? 1 : 6;

        // Move forward one square
        if (!this.getPiece(row + direction, col)) {
            moves.push([row + direction, col]);

            // Move forward two squares from starting position
            if (row === startRow && !this.getPiece(row + 2 * direction, col)) {
                moves.push([row + 2 * direction, col]);
            }
        }

        // Capture diagonally
        for (const dcol of [-1, 1]) {
            const targetPiece = this.getPiece(row + direction, col + dcol);
            if (targetPiece && targetPiece.color !== color) {
                moves.push([row + direction, col + dcol]);
            }

            // En passant
            const enPassantSquare = this.coordsToSquare(row + direction, col + dcol);
            if (this.enPassantTarget === enPassantSquare) {
                moves.push([row + direction, col + dcol]);
            }
        }

        return moves;
    }

    getKnightMoves(row, col, color) {
        const moves = [];
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [drow, dcol] of offsets) {
            const newRow = row + drow;
            const newCol = col + dcol;
            const targetPiece = this.getPiece(newRow, newCol);

            if ((newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) &&
                (!targetPiece || targetPiece.color !== color)) {
                moves.push([newRow, newCol]);
            }
        }

        return moves;
    }

    getBishopMoves(row, col, color) {
        return this.getSlidingMoves(row, col, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    }

    getRookMoves(row, col, color) {
        return this.getSlidingMoves(row, col, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    }

    getQueenMoves(row, col, color) {
        return this.getSlidingMoves(row, col, color, [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ]);
    }

    getSlidingMoves(row, col, color, directions) {
        const moves = [];

        for (const [drow, dcol] of directions) {
            let newRow = row + drow;
            let newCol = col + dcol;

            while (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
                const targetPiece = this.getPiece(newRow, newCol);

                if (!targetPiece) {
                    moves.push([newRow, newCol]);
                } else {
                    if (targetPiece.color !== color) {
                        moves.push([newRow, newCol]);
                    }
                    break;
                }

                newRow += drow;
                newCol += dcol;
            }
        }

        return moves;
    }

    getKingMoves(row, col, color) {
        const moves = [];
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [drow, dcol] of offsets) {
            const newRow = row + drow;
            const newCol = col + dcol;
            const targetPiece = this.getPiece(newRow, newCol);

            if ((newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) &&
                (!targetPiece || targetPiece.color !== color)) {
                moves.push([newRow, newCol]);
            }
        }

        // Castling
        if (!this.isInCheck(color)) {
            const rank = color === 'white' ? 0 : 7;

            // Kingside castling
            if (this.castlingRights[color].kingside &&
                !this.getPiece(rank, 5) && !this.getPiece(rank, 6) &&
                !this.wouldBeUnderAttack(rank, 5, color) &&
                !this.wouldBeUnderAttack(rank, 6, color)) {
                moves.push([rank, 6]);
            }

            // Queenside castling
            if (this.castlingRights[color].queenside &&
                !this.getPiece(rank, 1) && !this.getPiece(rank, 2) && !this.getPiece(rank, 3) &&
                !this.wouldBeUnderAttack(rank, 2, color) &&
                !this.wouldBeUnderAttack(rank, 3, color)) {
                moves.push([rank, 2]);
            }
        }

        return moves;
    }

    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Temporarily make the move
        const originalPiece = this.getPiece(fromRow, fromCol);
        const targetPiece = this.getPiece(toRow, toCol);

        this.setPiece(toRow, toCol, originalPiece);
        this.setPiece(fromRow, fromCol, null);

        const inCheck = this.isInCheck(color);

        // Undo the move
        this.setPiece(fromRow, fromCol, originalPiece);
        this.setPiece(toRow, toCol, targetPiece);

        return inCheck;
    }

    wouldBeUnderAttack(row, col, color) {
        // Temporarily place a king at the position
        const originalPiece = this.getPiece(row, col);
        this.setPiece(row, col, { type: 'king', color: color });

        const underAttack = this.isInCheck(color);

        // Restore original piece
        this.setPiece(row, col, originalPiece);

        return underAttack;
    }

    isInCheck(color) {
        // Find the king
        let kingRow, kingCol;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.type === 'king' && piece.color === color) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
            if (kingRow !== undefined) break;
        }

        // Check if any opponent piece can attack the king
        const opponentColor = color === 'white' ? 'black' : 'white';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === opponentColor) {
                    const moves = this.getPseudoLegalMoves(row, col);
                    if (moves.some(([r, c]) => r === kingRow && c === kingCol)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    getPseudoLegalMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece) return [];

        switch (piece.type) {
            case 'pawn':
                return this.getPawnMoves(row, col, piece.color);
            case 'knight':
                return this.getKnightMoves(row, col, piece.color);
            case 'bishop':
                return this.getBishopMoves(row, col, piece.color);
            case 'rook':
                return this.getRookMoves(row, col, piece.color);
            case 'queen':
                return this.getQueenMoves(row, col, piece.color);
            case 'king':
                // For check detection, we don't want infinite recursion with castling
                const moves = [];
                const offsets = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1], [0, 1],
                    [1, -1], [1, 0], [1, 1]
                ];
                for (const [drow, dcol] of offsets) {
                    const newRow = row + drow;
                    const newCol = col + dcol;
                    const targetPiece = this.getPiece(newRow, newCol);
                    if ((newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) &&
                        (!targetPiece || targetPiece.color !== piece.color)) {
                        moves.push([newRow, newCol]);
                    }
                }
                return moves;
        }
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        const targetPiece = this.getPiece(toRow, toCol);

        if (!piece || piece.color !== this.turn) return false;

        const validMoves = this.getValidMoves(fromRow, fromCol);
        const isValidMove = validMoves.some(([r, c]) => r === toRow && c === toCol);

        if (!isValidMove) return false;

        // Record move for history
        const moveNotation = this.getMoveNotation(fromRow, fromCol, toRow, toCol);

        // Handle captures
        if (targetPiece) {
            this.capturedPieces[targetPiece.color].push(targetPiece.type);
        }

        // Handle en passant capture
        const isEnPassant = piece.type === 'pawn' &&
                            this.coordsToSquare(toRow, toCol) === this.enPassantTarget &&
                            Math.abs(toCol - fromCol) === 1;

        if (isEnPassant) {
            const captureRow = this.turn === 'white' ? toRow - 1 : toRow + 1;
            const capturedPawn = this.getPiece(captureRow, toCol);
            if (capturedPawn) {
                this.capturedPieces[capturedPawn.color].push('pawn');
            }
            this.setPiece(captureRow, toCol, null);
        }

        // Handle castling
        if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
            const isKingside = toCol > fromCol;
            const rookFromCol = isKingside ? 7 : 0;
            const rookToCol = isKingside ? 5 : 3;
            const rook = this.getPiece(toRow, rookFromCol);
            this.setPiece(toRow, rookFromCol, null);
            this.setPiece(toRow, rookToCol, rook);
        }

        // Update en passant target
        if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            const enPassantRow = (fromRow + toRow) / 2;
            this.enPassantTarget = this.coordsToSquare(enPassantRow, toCol);
        } else {
            this.enPassantTarget = null;
        }

        // Move the piece
        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);

        // Handle pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.setPiece(toRow, toCol, { type: 'queen', color: piece.color });
        }

        // Update castling rights
        if (piece.type === 'king') {
            this.castlingRights[piece.color].kingside = false;
            this.castlingRights[piece.color].queenside = false;
        }
        if (piece.type === 'rook') {
            if (fromCol === 0) this.castlingRights[piece.color].queenside = false;
            if (fromCol === 7) this.castlingRights[piece.color].kingside = false;
        }

        // Add to move history
        this.moveHistory.push({
            from: this.coordsToSquare(fromRow, fromCol),
            to: this.coordsToSquare(toRow, toCol),
            piece: piece.type,
            notation: moveNotation,
            capturedPiece: targetPiece
        });

        // Switch turns
        this.turn = this.turn === 'white' ? 'black' : 'white';

        if (this.turn === 'white') {
            this.fullMoveNumber++;
        }

        return true;
    }

    getMoveNotation(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        const targetPiece = this.getPiece(toRow, toCol);

        let notation = '';

        // Piece prefix (except for pawns)
        if (piece.type !== 'pawn') {
            const pieceSymbol = piece.type[0].toUpperCase();
            notation += pieceSymbol === 'K' && piece.type === 'knight' ? 'N' : pieceSymbol;
        }

        // Capture notation
        if (targetPiece || (piece.type === 'pawn' && this.coordsToSquare(toRow, toCol) === this.enPassantTarget)) {
            if (piece.type === 'pawn') {
                notation += String.fromCharCode(97 + fromCol);
            }
            notation += 'x';
        }

        // Destination square
        notation += this.coordsToSquare(toRow, toCol);

        return notation;
    }

    isCheckmate() {
        if (!this.isInCheck(this.turn)) return false;
        return !this.hasLegalMoves();
    }

    isStalemate() {
        if (this.isInCheck(this.turn)) return false;
        return !this.hasLegalMoves();
    }

    hasLegalMoves() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === this.turn) {
                    const moves = this.getValidMoves(row, col);
                    if (moves.length > 0) return true;
                }
            }
        }
        return false;
    }

    getFEN() {
        let fen = '';

        // Board position
        for (let row = 7; row >= 0; row--) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (!piece) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    const pieceChar = this.getPieceChar(piece);
                    fen += piece.color === 'white' ? pieceChar.toUpperCase() : pieceChar.toLowerCase();
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (row > 0) fen += '/';
        }

        // Active color
        fen += ' ' + (this.turn === 'white' ? 'w' : 'b');

        // Castling rights
        let castling = '';
        if (this.castlingRights.white.kingside) castling += 'K';
        if (this.castlingRights.white.queenside) castling += 'Q';
        if (this.castlingRights.black.kingside) castling += 'k';
        if (this.castlingRights.black.queenside) castling += 'q';
        fen += ' ' + (castling || '-');

        // En passant target
        fen += ' ' + (this.enPassantTarget || '-');

        // Half move clock and full move number
        fen += ' ' + this.halfMoveClock + ' ' + this.fullMoveNumber;

        return fen;
    }

    getPieceChar(piece) {
        const chars = {
            'pawn': 'p',
            'knight': 'n',
            'bishop': 'b',
            'rook': 'r',
            'queen': 'q',
            'king': 'k'
        };
        return chars[piece.type];
    }

    reset() {
        this.board = this.createInitialBoard();
        this.turn = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
    }
}
