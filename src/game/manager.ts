import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { Board } from '../chess/board.js';
import type { GameConfig, Move } from '../chess/types.js';

export interface ExtendedMove extends Move {
  timestamp: string;
  player: string;
  fen: string;
}

export interface ExtendedGameState {
  id: string;
  white: string;
  black: string;
  currentFEN: string;
  turn: 'white' | 'black';
  moveNumber: number;
  status: 'waiting' | 'active' | 'finished';
  result?: '1-0' | '0-1' | '1/2-1/2';
  lastMoveAt: string | null;
  timeRemaining?: {
    white: number;
    black: number;
  };
}

export class GameManager {
  constructor(private gameDir: string) {}

  async loadConfig(): Promise<GameConfig> {
    const configPath = path.join(this.gameDir, 'config.yaml');
    const content = await fs.readFile(configPath, 'utf-8');
    return yaml.parse(content);
  }

  async saveConfig(config: GameConfig): Promise<void> {
    const configPath = path.join(this.gameDir, 'config.yaml');
    const content = yaml.stringify(config);
    await fs.writeFile(configPath, content, 'utf-8');
  }

  async loadState(): Promise<ExtendedGameState> {
    const statePath = path.join(this.gameDir, 'state.json');
    const content = await fs.readFile(statePath, 'utf-8');
    return JSON.parse(content);
  }

  async saveState(state: ExtendedGameState): Promise<void> {
    const statePath = path.join(this.gameDir, 'state.json');
    const content = JSON.stringify(state, null, 2);
    await fs.writeFile(statePath, content, 'utf-8');
  }

  async loadMoves(): Promise<ExtendedMove[]> {
    const movesPath = path.join(this.gameDir, 'moves.json');
    try {
      const content = await fs.readFile(movesPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async saveMoves(moves: ExtendedMove[]): Promise<void> {
    const movesPath = path.join(this.gameDir, 'moves.json');
    const content = JSON.stringify(moves, null, 2);
    await fs.writeFile(movesPath, content, 'utf-8');
  }

  async updateReadme(state: ExtendedGameState, moves: ExtendedMove[], config: GameConfig): Promise<void> {
    const readmePath = path.join(this.gameDir, 'README.md');
    
    const position = Board.fromFEN(state.currentFEN);
    const boardDisplay = this.generateBoardDisplay(position.board);
    const moveHistory = this.generateMoveHistory(moves);
    
    const statusText = state.status === 'finished' && state.result ? 
      `Finished - ${state.result === '1-0' ? 'White wins' : state.result === '0-1' ? 'Black wins' : 'Draw'}` :
      'Active';
    
    const content = `# Chess Game: ${config.id}

## Players
- **White**: @${config.white}
- **Black**: @${config.black}

## Game Settings
- **Time Control**: ${config.timeControl.type}
- **Variant**: ${config.variant || 'standard'}
- **Status**: ${statusText}
- **Current Turn**: ${state.turn === 'white' ? 'White' : 'Black'}

## How to Make a Move

1. Install the GitChess CLI:
   \`\`\`bash
   npm install -g gitchess
   \`\`\`

2. Clone the repository:
   \`\`\`bash
   git clone \${REPO_URL}
   cd \${REPO_NAME}
   \`\`\`

3. Make your move:
   \`\`\`bash
   gitchess move e2 e4 --game ${config.id}
   \`\`\`

4. Create a pull request:
   \`\`\`bash
   git checkout -b move-$(date +%s)
   git add games/${config.id}/moves.json
   git commit -m "Move in game ${config.id}"
   git push origin HEAD
   gh pr create --title "Move in game ${config.id}" --body "Making my move"
   \`\`\`

## Current Board Position

\`\`\`
${boardDisplay}
\`\`\`

## Move History

${moveHistory}
`;

    await fs.writeFile(readmePath, content, 'utf-8');
  }

  private generateBoardDisplay(board: (any | null)[][]): string {
    const pieces: Record<string, string> = {
      'white-king': 'K',
      'white-queen': 'Q',
      'white-rook': 'R',
      'white-bishop': 'B',
      'white-knight': 'N',
      'white-pawn': 'P',
      'black-king': 'k',
      'black-queen': 'q',
      'black-rook': 'r',
      'black-bishop': 'b',
      'black-knight': 'n',
      'black-pawn': 'p'
    };

    let display = '';
    
    for (let rank = 7; rank >= 0; rank--) {
      display += `${rank + 1} | `;
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece) {
          const key = `${piece.colour}-${piece.type}`;
          display += pieces[key] + ' ';
        } else {
          display += '. ';
        }
      }
      display += '\n';
    }
    
    display += '  +----------------\n';
    display += '    a b c d e f g h';
    
    return display;
  }

  private generateMoveHistory(moves: ExtendedMove[]): string {
    if (moves.length === 0) {
      return '_No moves yet_';
    }

    let history = '';
    
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];
      
      history += `${moveNum}. ${whiteMove.notation || `${whiteMove.from}-${whiteMove.to}`}`;
      
      if (blackMove) {
        history += ` ${blackMove.notation || `${blackMove.from}-${blackMove.to}`}`;
      }
      
      history += '\n';
    }
    
    return history;
  }
}