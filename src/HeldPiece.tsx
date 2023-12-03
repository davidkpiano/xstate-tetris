import { AnyActorRef } from 'xstate';
import { PieceView } from './PieceView';
import { useSelector } from '@xstate/react';

export function HeldPiece({
  actorRef,
}: {
  actorRef: AnyActorRef;
}): JSX.Element {
  const heldPiece = useSelector(actorRef, (state) => state.context.heldPiece);
  return <PieceView piece={heldPiece?.piece} />;
}
