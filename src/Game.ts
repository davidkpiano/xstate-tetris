import {
  Matrix,
  PositionedPiece,
  Piece,
  buildMatrix,
  addPieceToBoard,
  isEmptyPosition,
  flipClockwise,
  flipCounterclockwise,
  moveDown,
  moveRight,
  setPiece,
  hardDrop,
  moveLeft,
} from './Matrix';
import { Constants } from './constants';
import * as PieceQueue from './pieceQueue';
import { AnyEventObject, assign, fromCallback, raise, setup } from 'xstate';

export type State = 'PAUSED' | 'PLAYING' | 'LOST';

type HeldPiece = { available: boolean; piece: Piece };

export type Game = {
  state: State;
  matrix: Matrix;
  piece: PositionedPiece;
  heldPiece: HeldPiece | undefined;
  queue: PieceQueue.PieceQueue;
  points: number;
  lines: number;
};

export const getLevel = (game: Game): number => Math.floor(game.lines / 10) + 1;

export type Action =
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'TICK' }
  | { type: 'HOLD' }
  | { type: 'HARD_DROP' }
  | { type: 'MOVE_DOWN' }
  | { type: 'MOVE_LEFT' }
  | { type: 'MOVE_RIGHT' }
  | { type: 'FLIP_CLOCKWISE' }
  | { type: 'FLIP_COUNTERCLOCKWISE' }
  | { type: 'RESTART' }
  | { type: 'key.space' };

export const init = (): Game => {
  const queue = PieceQueue.create(5);
  const next = PieceQueue.getNext(queue);
  return {
    state: 'PLAYING',
    points: 0,
    lines: 0,
    matrix: buildMatrix(),
    piece: initializePiece(next.piece),
    heldPiece: undefined,
    queue: next.queue,
  };
};

export const tetrisMachine = setup({
  types: {
    events: {} as Action,
    context: {} as Game,
  },
  actors: {
    timer: fromCallback<AnyEventObject, { level: number }>(
      ({ sendBack, input, self }) => {
        let level = input.level;
        let i = setInterval(() => {
          sendBack({ type: 'TICK' });
        }, tickSeconds(input.level) * 1000);

        const sub = self._parent?.subscribe((s) => {
          if (getLevel(s.context) !== level) {
            clearInterval(i);
            level = getLevel(s.context);
            i = setInterval(() => {
              sendBack({ type: 'TICK' });
            }, tickSeconds(input.level) * 1000);
          }
        });

        return () => {
          clearInterval(i);
          sub?.unsubscribe();
        };
      }
    ),
  },
}).createMachine({
  id: 'tetris',
  context: init,
  initial: 'playing',
  states: {
    playing: {
      invoke: [
        {
          src: 'timer',
          input: ({ context }) => ({
            level: getLevel(context),
          }),
        },
      ],
      always: {
        guard: ({ context }) => {
          return context.state === 'LOST';
        },
        target: 'lost',
      },
      on: {
        'key.space': { actions: raise({ type: 'HARD_DROP' }) },
        PAUSE: 'paused',
        TOGGLE_PAUSE: 'paused',
        HARD_DROP: {
          actions: assign(({ context }) => {
            return lockInPiece({
              ...context,
              piece: hardDrop(context.matrix, context.piece),
            });
          }),
        },
        TICK: {
          actions: assign(({ context }) => {
            const updated = applyMove(moveDown, context);
            if (context.piece === updated.piece) {
              return lockInPiece(updated);
            } else {
              return updated;
            }
          }),
        },
        MOVE_DOWN: {
          actions: assign(({ context }) => {
            const updated = applyMove(moveDown, context);
            if (context.piece === updated.piece) {
              return lockInPiece(updated);
            } else {
              return updated;
            }
          }),
        },
        MOVE_LEFT: {
          actions: assign(({ context }) => {
            return applyMove(moveLeft, context);
          }),
        },
        MOVE_RIGHT: {
          actions: assign(({ context }) => {
            return applyMove(moveRight, context);
          }),
        },
        FLIP_CLOCKWISE: {
          actions: assign(({ context }) => {
            return applyMove(flipClockwise, context);
          }),
        },
        FLIP_COUNTERCLOCKWISE: {
          actions: assign(({ context }) => {
            return applyMove(flipCounterclockwise, context);
          }),
        },
        HOLD: {
          actions: assign(({ context }) => {
            if (context.heldPiece && !context.heldPiece.available) {
              return context;
            }

            // Ensure the held piece will fit on the matrix
            if (
              context.heldPiece &&
              !isEmptyPosition(context.matrix, {
                ...context.piece,
                piece: context.heldPiece.piece,
              })
            ) {
              return context;
            }

            const next = PieceQueue.getNext(context.queue);
            const newPiece = context.heldPiece?.piece ?? next.piece;

            return {
              ...context,
              heldPiece: { piece: context.piece.piece, available: false }, // hmm
              piece: initializePiece(newPiece),
              queue: newPiece === next.piece ? next.queue : context.queue,
            };
          }),
        },
      },
    },
    paused: {
      on: {
        RESUME: 'playing',
        TOGGLE_PAUSE: 'playing',
        'key.space': { actions: raise({ type: 'RESUME' }) },
      },
    },
    lost: {
      on: {
        RESTART: {
          actions: assign(init),
          target: 'playing',
        },
        'key.space': { actions: raise({ type: 'RESTART' }) },
      },
    },
  },
});

const lockInPiece = (game: Game): Game => {
  const [matrix, linesCleared] = setPiece(game.matrix, game.piece);
  const next = PieceQueue.getNext(game.queue);
  const piece = initializePiece(next.piece);
  return {
    ...game,
    state: isEmptyPosition(matrix, piece) ? game.state : 'LOST',
    matrix,
    piece,
    heldPiece: game.heldPiece
      ? { ...game.heldPiece, available: true }
      : undefined,
    queue: next.queue,
    lines: game.lines + linesCleared,
    points: game.points + addScore(linesCleared),
  };
};

const pointsPerLine = 100;
const addScore = (additionalLines: number) => {
  // what's this called?
  if (additionalLines === 4) {
    return pointsPerLine * 10;
  } else {
    return additionalLines * pointsPerLine;
  }
};

const initialPosition = {
  x: Constants.GAME_WIDTH / 2 - Constants.BLOCK_WIDTH / 2,
  y: 0,
};

const initializePiece = (piece: Piece): PositionedPiece => {
  return {
    position: initialPosition,
    piece,
    rotation: 0,
  };
};

const applyMove = (
  move: (matrix: Matrix, piece: PositionedPiece) => PositionedPiece | undefined,
  game: Game
): Game => {
  const afterFlip = move(game.matrix, game.piece);
  return afterFlip ? { ...game, piece: afterFlip } : game;
};

// Good display of merging piece + matrix
export function viewMatrix(game: Game): Matrix {
  let gameboard = game.matrix;

  // set the preview
  gameboard = addPieceToBoard(gameboard, hardDrop(gameboard, game.piece), true);

  // set the actual piece
  return addPieceToBoard(gameboard, game.piece);
}

const tickSeconds = (level: number) =>
  (0.8 - (level - 1) * 0.007) ** (level - 1);
