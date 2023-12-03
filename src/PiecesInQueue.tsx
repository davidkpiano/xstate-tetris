import { ActorRefFrom } from 'xstate';
import { PieceView } from './PieceView';

import { useSelector } from '@xstate/react';
import { tetrisMachine } from './Game';

export function PiecesInQueue({
  actorRef,
}: {
  actorRef: ActorRefFrom<typeof tetrisMachine>;
}): JSX.Element {
  const queue = useSelector(actorRef, (state) => state.context.queue);
  return (
    <div>
      {queue.queue.map((piece, i) => (
        <PieceView piece={piece} key={i} />
      ))}
    </div>
  );
}
