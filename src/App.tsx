import React from 'react';
import { GameboardView } from './Gameboard';
import * as Game from './Game';
import { HeldPiece } from './HeldPiece';
import { useActor } from '@xstate/react';
import { PiecesInQueue } from './PiecesInQueue';
// styled-components
import styled from 'styled-components';

export type KeyboardMap = Record<string, Game.Action>;

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
import { Controller } from './Controller';

const { inspect } = createBrowserInspector({
  url: 'http://localhost:3000/registry/inspect',
  filter: (event) => {
    if (event.type === '@xstate.event' || event.type === '@xstate.snapshot') {
      return event.event.type !== 'TICK';
    }
    return true;
  },
});

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

const GamePanel = (props: any): JSX.Element => {
  const [gameState, send, actorRef] = useActor(Game.tetrisMachine, { inspect });
  const game = gameState.context;
  const points = game.points;
  const linesCleared = game.lines;
  const state = game.state;
  const level = Game.getLevel(game);
  const keyboardMap = props.keyboardControls ?? defaultKeyboardMap;
  useKeyboardControls(keyboardMap, send);

  return (
    <Container>
      <div>
        <div style={{ opacity: state === 'PLAYING' ? 1 : 0.5 }}>
          <Score>
            <LeftHalf>
              <p>
                points
                <br />
                <Digits>{points}</Digits>
                <br />
                level {level}
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
            <HeldPiece actorRef={actorRef} />
          </LeftColumn>

          <MiddleColumn>
            <GameboardView actorRef={actorRef} />
          </MiddleColumn>

          <RightColumn>
            <PiecesInQueue actorRef={actorRef} />
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
