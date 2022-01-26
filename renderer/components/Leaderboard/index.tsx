import { FC, useEffect, useState } from "react";
import { createContext, useContextSelector } from "use-context-selector";
import { SocketContext } from "../Socket";

type LeaderboardContextType = { leaderboard: any[] };
const defaultLeaderboardContext: LeaderboardContextType = { leaderboard: [] };
const LeaderboardContext = createContext(defaultLeaderboardContext);

const withLeaderboard = (Component: FC) => (props: any) => {
  const { ...rest } = props;

  const [leaderboard, setLeaderboard] = useState<any[]>();
  const socket = useContextSelector(SocketContext, (s) => s.socket);

  useEffect(() => {
    socket.on("setLeaderboard", (arg) => {
      const leaderboard = typeof arg === "string" ? JSON.parse(arg) : arg;
      setLeaderboard(leaderboard);
    });
    socket.emit("requestLeaderboard");
  }, [socket]);

  return (
    <LeaderboardContext.Provider value={{ leaderboard }}>
      <Component {...rest} />
    </LeaderboardContext.Provider>
  );
};

export { withLeaderboard, LeaderboardContext };
