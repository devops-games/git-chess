# GitChess Browser Game

A fully-functional chess game that runs in your web browser. Play chess with a beautiful interface, drag-and-drop pieces, and full rule enforcement.

## Features

- **Full chess rules implementation**: All standard chess rules including castling, en passant, and pawn promotion
- **Interactive gameplay**: Click or drag-and-drop pieces to make moves
- **Visual feedback**: Highlights valid moves and selected pieces
- **Move validation**: Only legal moves are allowed
- **Check and checkmate detection**: Automatically detects check, checkmate, and stalemate
- **Move history**: View all moves made in algebraic notation
- **Captured pieces**: See all captured pieces for both sides
- **FEN notation**: View the current position in FEN format
- **Undo moves**: Take back your last move
- **Flip board**: View the board from either player's perspective

## How to Play

### Opening the Game

Simply open the `index.html` file in any modern web browser:

1. Navigate to the `web` directory
2. Double-click `index.html` or right-click and select "Open with Browser"
3. The game will load and you can start playing immediately

Alternatively, you can serve it with a local web server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js with npx
npx http-server

# Then open http://localhost:8000 in your browser
```

### Making Moves

There are two ways to move pieces:

1. **Click to Move**:
   - Click on a piece to select it
   - Valid moves will be highlighted with green dots
   - Click on a highlighted square to move the piece

2. **Drag and Drop**:
   - Click and hold on a piece
   - Drag it to the destination square
   - Release to drop and make the move

### Game Controls

- **New Game**: Start a fresh game (resets the board)
- **Undo Move**: Take back the last move
- **Flip Board**: Rotate the board 180 degrees

### Special Moves

- **Castling**: Click the king and then click on the castling square (two squares left or right)
- **En Passant**: Automatically available when conditions are met
- **Pawn Promotion**: Pawns automatically promote to queens when reaching the last rank

## Game Information Display

The sidebar shows:

- **Current Turn**: Which player's turn it is
- **Game Status**: Active, Check, Checkmate, or Stalemate
- **Move Count**: Total number of moves made
- **Move History**: List of all moves in algebraic notation
- **FEN Position**: Current board position in Forsyth-Edwards Notation
- **Captured Pieces**: Pieces captured by each player

## Browser Compatibility

This game works in all modern web browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling and layout
- `chess-engine.js` - Chess game logic and rules
- `game.js` - UI controller and event handling

## Technical Details

The game is built with:

- Pure vanilla JavaScript (no dependencies)
- HTML5 drag-and-drop API
- CSS Grid for board layout
- Unicode chess piece symbols

All chess rules are implemented including:

- Legal move generation for all pieces
- King safety checks
- Castling rights tracking
- En passant target square
- Check, checkmate, and stalemate detection
- FEN notation generation

## Offline Play

This game runs entirely in your browser with no internet connection required. All files are local and there are no external dependencies.

## Tips for Playing

1. Valid moves are shown with green circles when you select a piece
2. Potential captures are highlighted with a red overlay
3. The game prevents illegal moves automatically
4. You cannot move into check
5. The game will alert you when checkmate or stalemate occurs

Enjoy playing chess!
