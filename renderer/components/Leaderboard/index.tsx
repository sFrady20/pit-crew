import { FC } from "react";
import { createContext } from "use-context-selector";

type LeaderboardContextType = { leaderboard: [] };
const defaultLeaderboardContext: LeaderboardContextType = { leaderboard: [] };
const LeaderboardContext = createContext(defaultLeaderboardContext);

const withLeaderboard = (Component: FC) => (props: any) => {
  const { ...rest } = props;

  return (
    <LeaderboardContext.Provider value={{ leaderboard: [] }}>
      <Component {...rest} />
    </LeaderboardContext.Provider>
  );
};

export default { withLeaderboard, LeaderboardContext };
