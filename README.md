# GitChess

Play chess through Git pull requests! A unique way to play chess where every move is a commit, validated by CI/CD, and merged through pull requests.

## Features

- **Git-based gameplay**: Every move is a commit and pull request
- **CI/CD rule enforcement**: GitHub Actions validates all moves automatically
- **Browser-based chess game**: Play chess directly in your browser with a beautiful UI
- **Multiple simultaneous games**: Support for multiple games in parallel
- **Time controls**: Bullet, Blitz, Rapid, Classical, and Correspondence
- **Chess variants**: Standard and Chess960
- **CLI tool**: Easy-to-use command line interface
- **Automatic game state tracking**: Board position, move history, and game status

## Quick Start

### Browser Chess Game

Want to just play chess? Open `web/index.html` in your browser for a fully-functional chess game with a beautiful interface!

**Features:**
- Drag-and-drop pieces
- Click to move
- Visual move highlights
- Full chess rules enforcement
- Move history and FEN notation
- Undo moves and flip board

See the [web/README.md](web/README.md) for more details.

### Installation

```bash
npm install -g gitchess
```

### Creating a New Game

Games are created through GitHub Actions workflow dispatch:

1. Go to Actions → Create New Game
2. Enter player usernames and game settings
3. The workflow creates the game and notifies players

### Making Moves

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>

# Make a move
gitchess move e2 e4 --game <game-id>

# The CLI automatically creates a branch, commits, and can push
# Then create a pull request - it will be auto-merged if valid
```

## CLI Commands

### Make a Move
```bash
gitchess move <from> <to> [options]
  -g, --game <id>        Game ID
  -m, --message <msg>    Commit message
  --no-commit           Don't create a commit
  --no-push             Don't push to remote
```

### View Board
```bash
gitchess board [options]
  -g, --game <id>        Game ID
  -f, --fen             Show FEN notation
  -a, --ascii           Use ASCII characters only
```

### List Games
```bash
gitchess list [options]
  -s, --status <status>  Filter by status (active, finished)
  -p, --player <user>    Filter by player
```

### Check Game Status
```bash
gitchess status [options]
  -g, --game <id>        Game ID
  -v, --verbose         Show detailed information
```

### Validate a Move
```bash
gitchess validate <from> <to> [options]
  -g, --game <id>        Game ID
```

## Game Structure

Each game is stored in the `games/<game-id>/` directory:

- `config.yaml` - Game configuration (players, time control, variant)
- `state.json` - Current game state (board position, turn, status)
- `moves.json` - Complete move history
- `README.md` - Human-readable game overview with board display

## How It Works

1. **Player makes a move**: Uses the CLI to update the game files
2. **Creates pull request**: The move is submitted as a PR
3. **CI validates**: GitHub Actions checks:
   - It's the correct player's turn
   - The move follows chess rules
   - The move doesn't leave the king in check
4. **Auto-merge**: Valid moves are automatically merged
5. **Game updates**: State files and README are updated

## Time Controls

- **Bullet**: 1 minute + 1 second increment
- **Blitz**: 3 minutes + 2 second increment  
- **Rapid**: 10 minutes + 10 second increment
- **Classical**: 30 minutes + 30 second increment
- **Correspondence**: 1 day per move

## Rules Enforcement

The following rules are automatically enforced:

- Legal piece movements
- Turn order
- Check and checkmate detection
- Stalemate detection
- Castling rights
- En passant captures
- Pawn promotion
- Draw by repetition (coming soon)
- 50-move rule (coming soon)

## Development

### Setup
```bash
npm install
npm run build
```

### Testing
```bash
npm test
```

### Project Structure
```
src/
├── chess/          # Chess engine logic
├── cli/            # CLI commands
├── game/           # Game management
└── validation/     # Move validation for CI

web/
├── index.html      # Browser chess game
├── style.css       # Game styling
├── chess-engine.js # Chess logic for browser
├── game.js         # UI controller
└── README.md       # Browser game documentation
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

MIT