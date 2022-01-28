import React from "react";
import Head from "next/head";
import { SocketContext, withSocket } from "../components/Socket";
import { useContext, useContextSelector } from "use-context-selector";
import { map, times } from "lodash";
import { withMuiTheme } from "../components/MuiTheme";
import Timer from "../components/Timer";
import { LeaderboardContext, withLeaderboard } from "../components/Leaderboard";
import { DateTime } from "luxon";

const Player = (props: { playerIndex: number }) => {
  const { gameState } = useContext(SocketContext);
  const { playerIndex } = props;

  const { players = [] } = gameState;

  return (
    <div className="flex-1 flex flex-col items-center p-5 border-width-1px border-black">
      <Timer playerIndex={playerIndex} className="text-5xl font-bold" />
      <div className="text-xl font-bold">
        {players?.length > 1 ? `Player ${playerIndex + 1}` : `TIME`}
      </div>
    </div>
  );
};

const Leader = (props: { leader?: any; index: number }) => {
  const { index, leader } = props;

  const diff =
    leader?.startTime &&
    leader?.endTime &&
    DateTime.fromISO(leader.endTime).diff(DateTime.fromISO(leader.startTime));

  const fn = leader?.form?.firstName;
  const li = leader?.form?.lastName?.slice(0, 1);

  return (
    <div
      className={`py-3 px-8 ${
        !(index % 2) && "bg-gray-400"
      } flex flex-row justify-between text-3xl font-bold`}
    >
      <div>{`${index + 1}.${fn ? ` ${fn}` : ``}${li ? ` ${li}.` : ``}`}</div>
      <div>
        {diff
          ? `${diff.minutes > 0 ? `${diff.toFormat(`m`)}:` : ``}${
              diff.minutes > 0 ? diff.toFormat(`ss`) : diff.toFormat(`s`)
            }:${diff.toFormat("S").padEnd(3, "0").slice(0, 3)}`
          : ``}
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const { gameState, mergeGameState } = useContext(SocketContext);

  const { players = [] }: { players: {}[] } = gameState;
  const leaderboard =
    useContextSelector(LeaderboardContext, (x) => x.leaderboard) || [];

  return (
    <>
      <Head>
        <title>Discount Tire - Leaderboard</title>
      </Head>
      <div className="flex flex-col items-center space-y-10">
        <div className="flex flex-row w-full divide-x-2 divide-black divide-solid border-b-2 border-solid border-black">
          {map(players, (player, i) => (
            <Player key={i} playerIndex={i} />
          ))}
        </div>
        <img
          src="/images/discount-tire.png"
          style={{ height: "150px" }}
          draggable={false}
        />
        <div className="w-full px-10">
          {map(times(10), (i) => (
            <Leader key={i} index={i} leader={leaderboard[i]} />
          ))}
        </div>
      </div>
    </>
  );
};

export default withSocket(withLeaderboard(withMuiTheme(Leaderboard)));
