import { ActorRefFrom } from 'xstate';
import { tetrisMachine, viewMatrix } from './Game';
import { getClassName } from './Piece';
import { useSelector } from '@xstate/react';

export function GameboardView({
  actorRef,
}: {
  actorRef: ActorRefFrom<typeof tetrisMachine>;
}): JSX.Element {
  const game = useSelector(actorRef, (state) => state.context);
  const matrix = viewMatrix(game);

  return (
    <table className="game-board">
      <tbody>
        {matrix.map((row, i) => {
          const blocksInRow = row.map((block, j) => {
            const classString = `game-block ${
              block ? getClassName(block) : 'block-empty'
            }`;
            return <td key={j} className={classString} />;
          });

          return <tr key={i}>{blocksInRow}</tr>;
        })}
      </tbody>
    </table>
  );
}
