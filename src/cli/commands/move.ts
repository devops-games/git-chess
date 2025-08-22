import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { GameManager } from '../../game/manager.js';
import { MoveValidator } from '../../chess/moves.js';
import { Board } from '../../chess/board.js';
import type { Square } from '../../chess/types.js';

interface MoveOptions {
  game?: string;
  message?: string;
  commit?: boolean;
  push?: boolean;
}

export async function makeMove(from: string, to: string, options: MoveOptions): Promise<void> {
  if (!options.game) {
    console.error(chalk.red('Error: Game ID is required. Use --game flag or set GITCHESS_GAME environment variable'));
    process.exit(1);
  }

  const gameId = options.game;
  const gameDir = path.join('games', gameId);

  try {
    await fs.access(gameDir);
  } catch {
    console.error(chalk.red(`Game ${gameId} not found`));
    process.exit(1);
  }

  const manager = new GameManager(gameDir);
  const state = await manager.loadState();
  const config = await manager.loadConfig();

  const currentUser = execSync('git config user.name', { encoding: 'utf-8' }).trim();
  const expectedPlayer = state.turn === 'white' ? config.white : config.black;

  console.log(chalk.blue('Current player:'), currentUser);
  console.log(chalk.blue('Expected player:'), expectedPlayer);
  console.log(chalk.blue('Current turn:'), state.turn);

  const position = Board.fromFEN(state.currentFEN);
  const piece = Board.getPiece(position, from as Square);

  if (!piece) {
    console.error(chalk.red(`No piece at ${from}`));
    process.exit(1);
  }

  if (piece.colour !== state.turn) {
    console.error(chalk.red(`It's ${state.turn}'s turn, but the piece at ${from} is ${piece.colour}`));
    process.exit(1);
  }

  const parsedMove = MoveValidator.parseMove(from + to);
  const move: any = {
    from: parsedMove.from,
    to: parsedMove.to,
    piece: piece.type,
    promotion: parsedMove.promotion
  };

  if (!MoveValidator.isValidMove(position, move)) {
    console.error(chalk.red(`Invalid move: ${from} to ${to}`));
    console.log(chalk.yellow('Tip: Use "gitchess validate" to check why the move is invalid'));
    process.exit(1);
  }

  const newPosition = MoveValidator.makeMove(position, move);
  const newFEN = Board.toFEN(newPosition);
  const algebraicNotation = MoveValidator.toAlgebraicNotation(position, move);

  move.check = MoveValidator.isInCheck(newPosition, newPosition.turn);
  move.checkmate = MoveValidator.isCheckmate(newPosition);
  move.stalemate = MoveValidator.isStalemate(newPosition);
  move.notation = algebraicNotation;

  const moves = await manager.loadMoves();
  moves.push({
    ...move,
    timestamp: new Date().toISOString(),
    player: currentUser,
    fen: newFEN
  });

  await manager.saveMoves(moves);

  state.currentFEN = newFEN;
  state.turn = state.turn === 'white' ? 'black' : 'white';
  state.moveNumber = Math.floor(moves.length / 2) + 1;
  state.lastMoveAt = new Date().toISOString();

  if (move.checkmate) {
    state.status = 'finished';
    state.result = position.turn === 'white' ? '1-0' : '0-1';
    console.log(chalk.green.bold('Checkmate! Game over.'));
  } else if (move.stalemate) {
    state.status = 'finished';
    state.result = '1/2-1/2';
    console.log(chalk.yellow.bold('Stalemate! Game is a draw.'));
  } else if (move.check) {
    console.log(chalk.yellow.bold('Check!'));
  }

  await manager.saveState(state);
  await manager.updateReadme(state, moves, config);

  console.log(chalk.green(`✓ Move ${algebraicNotation} recorded successfully`));

  if (options.commit !== false) {
    const branchName = `move-${Date.now()}`;
    const commitMessage = options.message || `Move ${algebraicNotation} in game ${gameId}`;

    try {
      execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      execSync(`git add ${gameDir}`, { stdio: 'inherit' });
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      console.log(chalk.green(`✓ Created commit on branch ${branchName}`));

      if (options.push !== false) {
        execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });
        console.log(chalk.green('✓ Pushed to remote'));
        console.log(chalk.blue('\nNext step: Create a pull request to submit your move'));
        console.log(chalk.gray(`gh pr create --title "${commitMessage}" --body "Making move ${algebraicNotation}"`));
      }
    } catch (error) {
      console.error(chalk.red('Git operation failed:'), error);
      process.exit(1);
    }
  }
}