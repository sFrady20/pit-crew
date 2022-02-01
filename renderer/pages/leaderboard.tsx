import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { SocketContext, withSocket } from "../components/Socket";
import { useContext, useContextSelector } from "use-context-selector";
import { chain, map } from "lodash";
import { withMuiTheme } from "../components/MuiTheme";
import Timer from "../components/Timer";
import { LeaderboardContext, withLeaderboard } from "../components/Leaderboard";
import { DateTime } from "luxon";
import { AnimatePresence, motion } from "framer-motion";
import { formatDiff } from "../components/Timer";

const Player = (props: { playerIndex: number }) => {
  const { gameState } = useContext(SocketContext);
  const { playerIndex } = props;

  const { players = [] } = gameState;

  return (
    <div className="flex-1 flex flex-col items-center p-5 border-b-width-1px border-black">
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
    DateTime.fromISO(leader.endTime).diff(DateTime.fromISO(leader.startTime), [
      "minutes",
      "seconds",
      "milliseconds",
    ]);

  const fn = leader?.form?.firstName;
  const li = leader?.form?.lastName?.slice(0, 1);

  return (
    <div
      className={`py-3 px-8 ${
        !(index % 2) && "bg-gray-400"
      } flex flex-row justify-between text-3xl font-bold`}
    >
      <div>{`${index + 1}.${fn ? ` ${fn}` : ``}${li ? ` ${li}.` : ``}`}</div>
      <div>{formatDiff(diff)}</div>
    </div>
  );
};

const NewScorePopup = () => {
  const { socket } = useContext(SocketContext);

  const [newScore, setNewScore] = useState<[number, any, string]>();
  useEffect(() => {
    if (!!newScore) {
      const tm = setTimeout(() => {
        setNewScore(undefined);
      }, 6000);

      return () => {
        clearTimeout(tm);
      };
    }
  }, [newScore]);

  useEffect(() => {
    const listener = (arg: [number, any]) => {
      setNewScore([...arg, Math.random().toString()]);
    };
    socket.on("showNewScore", listener);
    return () => {
      socket.off("showNewScore", listener);
    };
  }, [socket, setNewScore]);

  const rank = newScore?.[0];
  const session = newScore?.[1];

  const diff =
    session?.startTime &&
    session?.endTime &&
    DateTime.fromISO(session.endTime).diff(
      DateTime.fromISO(session.startTime),
      ["minutes", "seconds", "milliseconds"]
    );

  const fn = session?.form?.firstName;
  const li = session?.form?.lastName?.slice(0, 1);

  return (
    <AnimatePresence exitBeforeEnter>
      {newScore && (
        <motion.div
          key={newScore?.[2]}
          initial={{ opacity: 0, translateY: 5 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: 5 }}
          className="absolute bottom-5 left-5 right-5 py-3 px-8 border-3px border-black font-bold bg-white"
        >
          <div className="text-xl">New Score</div>
          <div className="flex flex-row justify-between text-3xl ">
            <div>{`${rank + 1}.${fn ? ` ${fn}` : ``}${
              li ? ` ${li}.` : ``
            }`}</div>
            <div>{formatDiff(diff)}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Leaderboard = () => {
  const { gameState } = useContext(SocketContext);

  const {
    players = [],
    leaderboardPageSize = 10,
    leaderboardPages = 3,
    leaderboardPageTimeout = 10,
  } = gameState;
  const leaderboard =
    useContextSelector(LeaderboardContext, (x) => x.leaderboard) || [];

  const [page, setPage] = useState(0);

  const nextPage = useCallback(() => {
    setPage((p) => {
      const np = p + 1;
      if (leaderboardPageSize * np >= leaderboard.length) return 0;
      if (np >= leaderboardPages) return 0;
      return np;
    });
  }, [setPage, leaderboardPageSize, leaderboardPages, leaderboard]);

  useEffect(() => {
    const interval = setInterval(() => {
      nextPage();
    }, leaderboardPageTimeout * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [nextPage, leaderboardPageTimeout]);

  return (
    <>
      <Head>
        <title>Discount Tire - Leaderboard</title>
      </Head>
      <div className="flex flex-col items-center space-y-10">
        <div className="flex flex-row w-full divide-x-2 divide-black divide-solid border-b-2 border-solid border-black">
          {map(players as any[], (player, i) => (
            <Player key={i} playerIndex={i} />
          ))}
        </div>
        <img
          src="/images/discount-tire.png"
          style={{ height: "150px" }}
          draggable={false}
        />
        <div className="w-full px-10">
          <AnimatePresence exitBeforeEnter>
            <motion.div
              key={page}
              initial={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -20 }}
            >
              {chain(leaderboard)
                .slice(leaderboardPageSize * page)
                .take(leaderboardPageSize)
                .map((leader, i) => (
                  <Leader
                    key={i}
                    index={leaderboardPageSize * page + i}
                    leader={leader}
                  />
                ))
                .value()}
            </motion.div>
          </AnimatePresence>
        </div>
        <NewScorePopup />
      </div>
    </>
  );
};

export default withSocket(withLeaderboard(withMuiTheme(Leaderboard)));
