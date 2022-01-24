import React, { HTMLProps, useEffect, useRef, useState } from "react";
import Head from "next/head";
import {
  SocketContext,
  withSocket,
  withSocketProps,
} from "../components/Socket";
import { useContext } from "use-context-selector";
import { map, times } from "lodash";
import { withMuiTheme } from "../components/MuiTheme";
import { DateTime } from "luxon";

const PlayerTimer = (
  props: { playerIndex: number } & HTMLProps<HTMLDivElement>
) => {
  const { gameState } = useContext(SocketContext);
  const { playerIndex, ...rest } = props;

  const timerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!timerRef.current) return;

    const interval = setInterval(() => {
      const startTimeStr = gameState[`player-${playerIndex}`]?.startTime;
      const endTimeStr = gameState[`player-${playerIndex}`]?.endTime;

      if (!startTimeStr) {
        timerRef.current.textContent = "00:00";
      } else if (!endTimeStr) {
        const startTime = DateTime.fromISO(startTimeStr);
        let endTime = DateTime.now();
        const diff = endTime.diff(startTime);
        timerRef.current.textContent = diff.toFormat("mm:ss.S");
      } else {
        const startTime = DateTime.fromISO(startTimeStr);
        let endTime = DateTime.fromISO(endTimeStr);
        if (!endTime || endTime < startTime) endTime = DateTime.now();
        const diff = endTime.diff(startTime);
        timerRef.current.textContent = diff.toFormat("mm:ss.S");
      }
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [
    gameState[`player-${playerIndex}`]?.startTime,
    gameState[`player-${playerIndex}`]?.endTime,
    timerRef.current,
  ]);

  return <div {...rest} ref={timerRef}></div>;
};

const Player = (props: { playerIndex: number }) => {
  const { gameState } = useContext(SocketContext);
  const { playerIndex } = props;

  const { numPlayers = 1 } = gameState;

  return (
    <div className="flex-1 flex flex-col items-center p-5 border-width-1px border-black">
      <PlayerTimer playerIndex={playerIndex} className="text-5xl font-bold" />
      <div className="text-xl font-bold">
        {numPlayers > 1 ? `Player ${playerIndex + 1}` : `TIME`}
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const { gameState, mergeGameState } = useContext(SocketContext);

  const { numPlayers = 1 } = gameState;

  return (
    <>
      <Head>
        <title>Discount Tire - Leaderboard</title>
      </Head>
      <div className="flex flex-col items-center space-y-10">
        <div className="flex flex-row w-full bg-cool-gray-400">
          {map(times(numPlayers), (i) => (
            <Player playerIndex={i} />
          ))}
        </div>
        <img src="/images/discount-tire.png" style={{ height: "150px" }} />
        <div className="w-full px-10">
          {map(times(10), (i) => (
            <div
              key={i}
              className={`py-2 px-8 ${!(i % 2) && "bg-gray-400"}`}
            >{`${i + 1}`}</div>
          ))}
        </div>
      </div>
    </>
  );
};

export const getServerSideProps = withSocketProps(() => {
  return {};
});

export default withSocket(withMuiTheme(Leaderboard));
