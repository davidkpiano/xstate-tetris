import { ActorRefFrom } from 'xstate';
import { tetrisMachine } from './Game';
import styled from 'styled-components';

type Props = {
  actorRef: ActorRefFrom<typeof tetrisMachine>;
  style: React.CSSProperties;
};

export function Controller({ actorRef, style }: Props): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 12px',
        ...style,
      }}
    >
      <div
        style={{
          padding: '18px',
          border: '1px solid #DDD',
          borderRadius: '72px',
        }}
      >
        <DpadRow>
          <UpDown onClick={() => actorRef.send({ type: 'FLIP_CLOCKWISE' })} />
        </DpadRow>
        <DpadMidRow>
          <LeftRight onClick={() => actorRef.send({ type: 'MOVE_LEFT' })} />
          <LeftRight onClick={() => actorRef.send({ type: 'MOVE_RIGHT' })} />
        </DpadMidRow>
        <DpadRow>
          <UpDown onClick={() => actorRef.send({ type: 'MOVE_DOWN' })} />
        </DpadRow>
      </div>
      <div>
        <Row>
          <RoundBtn onClick={() => actorRef.send({ type: 'HARD_DROP' })} />
        </Row>
        <MidRow>
          <RoundBtn onClick={() => actorRef.send({ type: 'HOLD' })} />
          <RoundBtn onClick={() => actorRef.send({ type: 'FLIP_CLOCKWISE' })} />
        </MidRow>
        <Row>
          <RoundBtn
            onClick={() => actorRef.send({ type: 'FLIP_COUNTERCLOCKWISE' })}
          />
        </Row>
      </div>
    </div>
  );
}

const dpadSize = 36;

const DpadRow = styled.div`
  display: flex;
  justify-content: center;
  height: ${dpadSize}px;
  width: ${dpadSize * 3}px;
`;

const DpadMidRow = styled(DpadRow)`
  align-items: center;
  justify-content: space-between;
`;

const LeftRight = styled.button`
  width: ${dpadSize}px;
  height: ${dpadSize}px;
  border: 2px solid #ddd;
`;

const UpDown = styled.button`
  width: ${dpadSize}px;
  height: ${dpadSize}px;
  border: 2px solid #ddd;
`;

const RoundBtn = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  border: 2px solid #ddd;
`;

const Row = styled.div`
  display: flex;
  justify-content: center;
  height: 48px;
  width: 144px;
`;

const MidRow = styled(Row)`
  align-items: center;
  justify-content: space-between;
`;
