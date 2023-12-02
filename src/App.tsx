import React from 'react';
import Gameboard from './Gameboard';
import * as Game from './Game';
import HeldPiece from './HeldPiece';
import { Context } from './context';
import { KeyboardMap } from './useKeyboardControls';
import { ActorRefFrom } from 'xstate';
import { useActor } from '@xstate/react';
import { PiecesInQueue } from './PiecesInQueue';
// styled-components
import styled from 'styled-components';

export type RenderFn = (params: {
  HeldPiece: React.ComponentType;
  Gameboard: React.ComponentType;
  PieceQueue: React.ComponentType;
  points: number;
  linesCleared: number;
  level: number;
  state: Game.State;
  actorRef: ActorRefFrom<(typeof Game)['tetrisMachine']>;
}) => React.ReactElement;

const defaultKeyboardMap: KeyboardMap = {
  ArrowDown: { type: 'MOVE_DOWN' },
  ArrowLeft: { type: 'MOVE_LEFT' },
  ArrowRight: { type: 'MOVE_RIGHT' },
  ArrowUp: { type: 'FLIP_CLOCKWISE' },
  ' ': { type: 'key.space' },
  z: { type: 'FLIP_COUNTERCLOCKWISE' },
  x: { type: 'FLIP_CLOCKWISE' },
  p: { type: 'TOGGLE_PAUSE' },
  c: { type: 'HOLD' },
  Shift: { type: 'HOLD' },
};

function useKeyboardControls(
  keyboardMap: KeyboardMap,
  fn: (event: any) => void
) {
  const keyboardMapRef = React.useRef(keyboardMap);
  keyboardMapRef.current = keyboardMap;
  const handler = (event: KeyboardEvent) => {
    const key = event.key;
    const keyboardMap = keyboardMapRef.current;
    const action = keyboardMap[key];
    if (action) {
      fn(action);
    }
  };
  React.useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, []);
}

import { createBrowserInspector } from '@statelyai/inspect';
import Controller from './Controller';

const { inspect } = createBrowserInspector({
  url: 'http://localhost:3000/registry/inspect',
  filter: (event) => {
    if (event.type === '@xstate.event' || event.type === '@xstate.snapshot') {
      return event.event.type !== 'TICK';
    }
    return true;
  },
});

// const bank = createMachine({
//   id: 'bank',
//   after: {
//     1000: {
//       actions: sendTo(
//         ({ system }) => {
//           const ledger = system.get('ledger');
//           console.log({ ledger });
//           return ledger;
//         },
//         ({ self }) => ({
//           type: 'retrieveAccount',
//           sender: self
//         })
//       )
//     }
//   },
//   on: {
//     buyersAccount: {
//       actions: sendTo(
//         ({ system }) => system.get('account'),
//         ({ self }) => ({
//           type: 'getBalance',
//           sender: self
//         })
//       )
//     }
//   }
// });

// const ledger = createMachine({
//   id: 'ledger',
//   on: {
//     retrieveAccount: {
//       actions: sendTo(({ event }) => event.sender, {
//         type: 'buyersAccount'
//       })
//     }
//   }
// });

// const account = createMachine({
//   id: 'account',
//   on: {
//     getBalance: {
//       actions: sendTo(({ event }) => event.sender, {
//         type: 'balance'
//       })
//     }
//   }
// });

// const main = createMachine({
//   id: 'main',
//   invoke: [
//     {
//       systemId: 'bank',
//       src: bank
//     },
//     {
//       systemId: 'ledger',
//       src: ledger
//     },
//     {
//       systemId: 'account',
//       src: account
//     }
//   ]
// });

// const actor = createActor(main, {
//   inspect: (event) => {
//     console.log('>>', event);

//     inspect.next(event);
//   }
// });

// actor.start();

export function Tetris(props: {
  keyboardControls?: KeyboardMap;
  children: RenderFn;
}): JSX.Element {
  const [state, send, actorRef] = useActor(Game.tetrisMachine, { inspect });

  const game = state.context;
  const keyboardMap = props.keyboardControls ?? defaultKeyboardMap;
  useKeyboardControls(keyboardMap, send);
  const level = Game.getLevel(game);
  return (
    <Context.Provider value={game}>
      {props.children({
        HeldPiece,
        Gameboard,
        PieceQueue: PiecesInQueue,
        points: game.points,
        linesCleared: game.lines,
        state: game.state,
        level,
        actorRef,
      })}
    </Context.Provider>
  );
}

const Container = styled.div`
  margin: 24px auto 0;
  width: 100%;
  max-width: 376px;
`;

const Score = styled.div`
  position: relative;
  font-family: monospace;
  font-size: 18px;
  color: #888;
`;

const LeftHalf = styled.div`
  display: inline-block;
  width: 50%;
`;

const RightHalf = styled(LeftHalf)`
  text-align: right;
`;

const Column = styled.div`
  display: inline-block;
  vertical-align: top;
`;

const LeftColumn = styled(Column)`
  width: 88px;
`;

const RightColumn = styled(LeftColumn)`
  padding-left: 15px;
`;

const MiddleColumn = styled(Column)`
  width: 200px;
`;

const Popup = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 12px 24px;
  border-radius: 4px;
  text-align: center;
  box-shadow: 2px 7px 18px 3px #d2d2d2;
`;

const Alert = styled.h2`
  color: #666;
  margin: 0;
`;

const Button = styled.button`
  border: 1px solid #666;
  background: none;
  margin-top: 12px;
  border-radius: 4px;
`;

const GamePanel = (): JSX.Element => {
  return (
    <Container>
      <Tetris>
        {({
          Gameboard,
          HeldPiece,
          PieceQueue,
          points,
          linesCleared,
          state,
          actorRef,
        }) => (
          <div>
            <div style={{ opacity: state === 'PLAYING' ? 1 : 0.5 }}>
              <Score>
                <LeftHalf>
                  <p>
                    points
                    <br />
                    <Digits>{points}</Digits>
                  </p>
                </LeftHalf>
                <RightHalf>
                  <p>
                    lines
                    <br />
                    <Digits>{linesCleared}</Digits>
                  </p>
                </RightHalf>
              </Score>

              <LeftColumn>
                <HeldPiece />
              </LeftColumn>

              <MiddleColumn>
                <Gameboard />
              </MiddleColumn>

              <RightColumn>
                <PieceQueue />
              </RightColumn>

              <Controller actorRef={actorRef} />
            </div>
            {state === 'PAUSED' && (
              <Popup>
                <Alert>Paused</Alert>
                <Button onClick={() => actorRef.send({ type: 'RESUME' })}>
                  Resume
                </Button>
              </Popup>
            )}

            {state === 'LOST' && (
              <Popup>
                <Alert>Game Over</Alert>
                <Button onClick={() => actorRef.send({ type: 'RESTART' })}>
                  Start
                </Button>
              </Popup>
            )}
          </div>
        )}
      </Tetris>
    </Container>
  );
};

const Digit = styled.span`
  font-family: monospace;
  padding: 1px;
  margin: 1px;
  font-size: 24px;
`;

type DigitsProps = {
  children: number;
  count?: number;
};
const Digits = ({ children, count = 4 }: DigitsProps): JSX.Element => {
  let str = children.toString();

  while (str.length < count) {
    str = `${0}${str}`;
  }

  return (
    <>
      {str.split('').map((digit, index) => (
        <Digit key={index}>{digit}</Digit>
      ))}
    </>
  );
};

export default GamePanel;
