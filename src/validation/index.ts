#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { GameManager } from '../game/manager.js';
import { Board } from '../chess/board.js';
import { MoveValidator } from '../chess/moves.js';

const program = new Command();

program
  .name('validate')
  .description('Validation tool for GitHub Actions')
  .version('1.0.0');

program
  .command('validate')
  .option('--game-id <id>', 'Game ID')
  .option('--player <username>', 'Player username')
  .action(async (options) => {
    try {
      const gameDir = path.join('games', options.gameId);
      const manager = new GameManager(gameDir);
      
      const config = await manager.loadConfig();
      const state = await manager.loadState();
      const oldMoves = await manager.loadMoves();
      
      const movesPath = path.join(gameDir, 'moves.json');
      const newMovesContent = await fs.readFile(movesPath, 'utf-8');
      const newMoves = JSON.parse(newMovesContent);
      
      if (newMoves.length !== oldMoves.length + 1) {
        console.error('Error: Exactly one move must be added');
        process.exit(1);
      }
      
      const newMove = newMoves[newMoves.length - 1];
      
      const expectedPlayer = state.turn === 'white' ? config.white : config.black;
      if (options.player !== expectedPlayer) {
        console.error(`Error: It's ${expectedPlayer}'s turn, not ${options.player}'s`);
        process.exit(1);
      }
      
      const position = Board.fromFEN(state.currentFEN);
      
      if (!MoveValidator.isValidMove(position, newMove)) {
        console.error('Error: Invalid move');
        process.exit(1);
      }
      
      const newPosition = MoveValidator.makeMove(position, newMove);
      const newFEN = Board.toFEN(newPosition);
      
      const updatedState = {
        ...state,
        currentFEN: newFEN,
        turn: (state.turn === 'white' ? 'black' : 'white') as 'white' | 'black',
        moveNumber: Math.floor(newMoves.length / 2) + 1,
        lastMoveAt: new Date().toISOString()
      };
      
      if (MoveValidator.isCheckmate(newPosition)) {
        updatedState.status = 'finished';
        updatedState.result = position.turn === 'white' ? '1-0' : '0-1';
      } else if (MoveValidator.isStalemate(newPosition)) {
        updatedState.status = 'finished';
        updatedState.result = '1/2-1/2';
      }
      
      await manager.saveState(updatedState);
      await manager.updateReadme(updatedState, newMoves, config);
      
      console.log('Move validated successfully');
      process.exit(0);
    } catch (error) {
      console.error('Validation failed:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('status')
  .option('--game-id <id>', 'Game ID')
  .action(async (options) => {
    try {
      const gameDir = path.join('games', options.gameId);
      const manager = new GameManager(gameDir);
      const state = await manager.loadState();
      
      const position = Board.fromFEN(state.currentFEN);
      
      let status = `Turn: ${state.turn}`;
      
      if (MoveValidator.isInCheck(position, position.turn)) {
        status += ' - Check';
      }
      
      if (MoveValidator.isCheckmate(position)) {
        status += ' - Checkmate';
      }
      
      if (MoveValidator.isStalemate(position)) {
        status += ' - Stalemate';
      }
      
      console.log(status);
      process.exit(0);
    } catch (error) {
      console.error('Status check failed:', (error as Error).message);
      process.exit(1);
    }
  });

program.parse();