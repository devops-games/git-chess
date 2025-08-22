#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { makeMove } from './commands/move.js';
import { showBoard } from './commands/board.js';
import { listGames } from './commands/list.js';
import { showStatus } from './commands/status.js';
import { validateMove } from './commands/validate.js';

const program = new Command();

program
  .name('gitchess')
  .description('CLI tool for GitChess - Play chess through Git pull requests')
  .version('1.0.0');

program
  .command('move <from> <to>')
  .description('Make a chess move')
  .option('-g, --game <id>', 'Game ID', process.env.GITCHESS_GAME)
  .option('-m, --message <msg>', 'Commit message')
  .option('--no-commit', 'Don\'t create a commit')
  .option('--no-push', 'Don\'t push to remote')
  .action(async (from: string, to: string, options: any) => {
    try {
      await makeMove(from, to, options);
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('board')
  .description('Show the current board position')
  .option('-g, --game <id>', 'Game ID', process.env.GITCHESS_GAME)
  .option('-f, --fen', 'Show FEN notation')
  .option('-a, --ascii', 'Use ASCII characters only')
  .action(async (options: any) => {
    try {
      await showBoard(options);
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all games')
  .option('-s, --status <status>', 'Filter by status (active, finished)')
  .option('-p, --player <username>', 'Filter by player')
  .action(async (options: any) => {
    try {
      await listGames(options);
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show game status')
  .option('-g, --game <id>', 'Game ID', process.env.GITCHESS_GAME)
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options: any) => {
    try {
      await showStatus(options);
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('validate <from> <to>')
  .description('Validate a move without making it')
  .option('-g, --game <id>', 'Game ID', process.env.GITCHESS_GAME)
  .action(async (from: string, to: string, options: any) => {
    try {
      await validateMove(from, to, options);
    } catch (error) {
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  });

program.parse();