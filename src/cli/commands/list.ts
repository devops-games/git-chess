import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { GameManager } from '../../game/manager.js';

interface ListOptions {
  status?: string;
  player?: string;
}

export async function listGames(options: ListOptions): Promise<void> {
  try {
    const gamesDir = 'games';
    await fs.access(gamesDir);
    
    const entries = await fs.readdir(gamesDir, { withFileTypes: true });
    const gameDirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    
    if (gameDirs.length === 0) {
      console.log(chalk.yellow('No games found'));
      return;
    }
    
    const games = [];
    
    for (const gameId of gameDirs) {
      const gameDir = path.join(gamesDir, gameId);
      const manager = new GameManager(gameDir);
      
      try {
        const config = await manager.loadConfig();
        const state = await manager.loadState();
        
        if (options.status && state.status !== options.status) {
          continue;
        }
        
        if (options.player && config.white !== options.player && config.black !== options.player) {
          continue;
        }
        
        games.push({
          id: gameId,
          white: config.white,
          black: config.black,
          status: state.status,
          turn: state.turn,
          moves: state.moveNumber,
          timeControl: config.timeControl.type,
          result: state.result
        });
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not load game ${gameId}`));
      }
    }
    
    if (games.length === 0) {
      console.log(chalk.yellow('No matching games found'));
      return;
    }
    
    console.log(chalk.bold('\nGames:\n'));
    
    for (const game of games) {
      const statusColour = game.status === 'active' ? chalk.green : chalk.gray;
      const statusIcon = game.status === 'active' ? '●' : '○';
      
      console.log(`${statusIcon} ${chalk.bold(game.id)}`);
      console.log(`  ${chalk.white(game.white)} vs ${chalk.gray(game.black)}`);
      console.log(`  Status: ${statusColour(game.status)}`);
      
      if (game.status === 'active') {
        console.log(`  Turn: ${game.turn} (move ${game.moves})`);
      } else if (game.result) {
        const resultText = game.result === '1-0' ? 'White wins' :
                          game.result === '0-1' ? 'Black wins' : 'Draw';
        console.log(`  Result: ${chalk.bold(resultText)}`);
      }
      
      console.log(`  Time control: ${game.timeControl}`);
      console.log();
    }
    
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      console.log(chalk.yellow('No games directory found. Create a game first.'));
    } else {
      console.error(chalk.red('Error listing games:'), (error as Error).message);
    }
    process.exit(1);
  }
}