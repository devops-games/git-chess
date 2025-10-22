// Game UI Controller

class ChessGame {
    constructor() {
        this.engine = new ChessEngine();
        this.boardElement = document.getElementById('chess-board');
        this.selectedSquare = null;
        this.validMoves = [];
        this.isFlipped = false;

        this.pieceUnicode = {
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

        this.init();
    }

    init() {
        this.renderBoard();
        this.updateUI();
        this.attachEventListeners();
    }

    renderBoard() {
        this.boardElement.innerHTML = '';

        for (let row = 7; row >= 0; row--) {
            for (let col = 0; col < 8; col++) {
                const displayRow = this.isFlipped ? 7 - row : row;
                const displayCol = this.isFlipped ? 7 - col : col;

                const square = document.createElement('div');
                square.className = 'square';
                square.dataset.row = displayRow;
                square.dataset.col = displayCol;

                // Alternate colors
                const isLight = (displayRow + displayCol) % 2 === 0;
                square.classList.add(isLight ? 'light' : 'dark');

                // Add piece if present
                const piece = this.engine.getPiece(displayRow, displayCol);
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.className = 'piece';
                    pieceElement.textContent = this.pieceUnicode[piece.color][piece.type];
                    pieceElement.draggable = true;
                    square.appendChild(pieceElement);
                }

                square.addEventListener('click', (e) => this.handleSquareClick(displayRow, displayCol));
                square.addEventListener('dragstart', (e) => this.handleDragStart(e, displayRow, displayCol));
                square.addEventListener('dragover', (e) => this.handleDragOver(e));
                square.addEventListener('drop', (e) => this.handleDrop(e, displayRow, displayCol));

                this.boardElement.appendChild(square);
            }
        }
    }

    handleSquareClick(row, col) {
        const piece = this.engine.getPiece(row, col);

        // If a square is already selected
        if (this.selectedSquare) {
            const [selectedRow, selectedCol] = this.selectedSquare;

            // Try to make a move
            if (this.isValidMoveTarget(row, col)) {
                this.makeMove(selectedRow, selectedCol, row, col);
            } else if (piece && piece.color === this.engine.turn) {
                // Select a different piece
                this.selectSquare(row, col);
            } else {
                // Deselect
                this.clearSelection();
            }
        } else {
            // Select a piece
            if (piece && piece.color === this.engine.turn) {
                this.selectSquare(row, col);
            }
        }
    }

    handleDragStart(e, row, col) {
        const piece = this.engine.getPiece(row, col);
        if (!piece || piece.color !== this.engine.turn) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ row, col }));

        this.selectSquare(row, col);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e, toRow, toCol) {
        e.preventDefault();

        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const { row: fromRow, col: fromCol } = data;

            if (this.isValidMoveTarget(toRow, toCol)) {
                this.makeMove(fromRow, fromCol, toRow, toCol);
            } else {
                this.clearSelection();
            }
        } catch (error) {
            console.error('Error handling drop:', error);
            this.clearSelection();
        }
    }

    selectSquare(row, col) {
        this.selectedSquare = [row, col];
        this.validMoves = this.engine.getValidMoves(row, col);
        this.updateBoardHighlights();
    }

    clearSelection() {
        this.selectedSquare = null;
        this.validMoves = [];
        this.updateBoardHighlights();
    }

    isValidMoveTarget(row, col) {
        return this.validMoves.some(([r, c]) => r === row && c === col);
    }

    updateBoardHighlights() {
        const squares = this.boardElement.querySelectorAll('.square');

        squares.forEach(square => {
            square.classList.remove('selected', 'valid-move', 'has-piece');

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);

            // Highlight selected square
            if (this.selectedSquare &&
                this.selectedSquare[0] === row &&
                this.selectedSquare[1] === col) {
                square.classList.add('selected');
            }

            // Highlight valid moves
            if (this.isValidMoveTarget(row, col)) {
                square.classList.add('valid-move');
                if (this.engine.getPiece(row, col)) {
                    square.classList.add('has-piece');
                }
            }
        });
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const success = this.engine.makeMove(fromRow, fromCol, toRow, toCol);

        if (success) {
            this.clearSelection();
            this.renderBoard();
            this.updateUI();
            this.checkGameStatus();
        }
    }

    updateUI() {
        // Update turn indicator
        document.getElementById('current-turn').textContent =
            this.engine.turn.charAt(0).toUpperCase() + this.engine.turn.slice(1);

        // Update move count
        document.getElementById('move-count').textContent = this.engine.moveHistory.length;

        // Update move history
        this.updateMoveHistory();

        // Update captured pieces
        this.updateCapturedPieces();

        // Update FEN
        document.getElementById('fen-display').textContent = this.engine.getFEN();
    }

    updateMoveHistory() {
        const movesList = document.getElementById('moves-list');
        movesList.innerHTML = '';

        const moves = this.engine.moveHistory;
        for (let i = 0; i < moves.length; i += 2) {
            const moveEntry = document.createElement('div');
            moveEntry.className = 'move-entry';

            const moveNumber = document.createElement('span');
            moveNumber.className = 'move-number';
            moveNumber.textContent = `${Math.floor(i / 2) + 1}.`;

            const moveText = document.createElement('span');
            moveText.className = 'move-text';

            let text = moves[i].notation;
            if (i + 1 < moves.length) {
                text += ' ' + moves[i + 1].notation;
            }
            moveText.textContent = text;

            moveEntry.appendChild(moveNumber);
            moveEntry.appendChild(moveText);
            movesList.appendChild(moveEntry);
        }

        // Scroll to bottom
        movesList.scrollTop = movesList.scrollHeight;
    }

    updateCapturedPieces() {
        const whiteCaptured = document.getElementById('white-captured');
        const blackCaptured = document.getElementById('black-captured');

        whiteCaptured.innerHTML = '';
        blackCaptured.innerHTML = '';

        // Display captured white pieces
        this.engine.capturedPieces.white.forEach(pieceType => {
            const piece = document.createElement('span');
            piece.className = 'captured-piece';
            piece.textContent = this.pieceUnicode.white[pieceType];
            whiteCaptured.appendChild(piece);
        });

        // Display captured black pieces
        this.engine.capturedPieces.black.forEach(pieceType => {
            const piece = document.createElement('span');
            piece.className = 'captured-piece';
            piece.textContent = this.pieceUnicode.black[pieceType];
            blackCaptured.appendChild(piece);
        });
    }

    checkGameStatus() {
        let status = 'Active';

        if (this.engine.isCheckmate()) {
            const winner = this.engine.turn === 'white' ? 'Black' : 'White';
            status = `Checkmate! ${winner} wins!`;
            this.showGameOverMessage(status);
        } else if (this.engine.isStalemate()) {
            status = 'Stalemate! Draw';
            this.showGameOverMessage(status);
        } else if (this.engine.isInCheck(this.engine.turn)) {
            status = 'Check!';
        }

        document.getElementById('game-status').textContent = status;
    }

    showGameOverMessage(message) {
        setTimeout(() => {
            alert(message + '\n\nClick "New Game" to play again.');
        }, 100);
    }

    newGame() {
        if (this.engine.moveHistory.length > 0) {
            if (!confirm('Start a new game? Current game will be lost.')) {
                return;
            }
        }

        this.engine.reset();
        this.clearSelection();
        this.renderBoard();
        this.updateUI();
    }

    undoMove() {
        if (this.engine.moveHistory.length === 0) {
            alert('No moves to undo!');
            return;
        }

        // Simple implementation: reset and replay all moves except the last one
        const moves = [...this.engine.moveHistory];
        moves.pop();

        this.engine.reset();

        for (const move of moves) {
            const [fromRow, fromCol] = this.engine.squareToCoords(move.from);
            const [toRow, toCol] = this.engine.squareToCoords(move.to);
            this.engine.makeMove(fromRow, fromCol, toRow, toCol);
        }

        this.clearSelection();
        this.renderBoard();
        this.updateUI();
    }

    flipBoard() {
        this.isFlipped = !this.isFlipped;
        this.clearSelection();
        this.renderBoard();
    }

    attachEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('undo-move').addEventListener('click', () => this.undoMove());
        document.getElementById('flip-board').addEventListener('click', () => this.flipBoard());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
