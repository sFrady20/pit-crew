import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import io, { Socket } from "socket.io-client";
import { createContext } from "use-context-selector";
import { useImmer } from "use-immer";
import { URL } from "url";
import { map } from "lodash";
import { DateTime } from "luxon";

type GameStateType = any;

type SocketContextType = {
  ip: string;
  port: number;
  socket: Socket;
  timeOffset: number;
  gameState: GameStateType;
  reload: () => void;
  mergeGameState: (updates: any) => void;
  setInGameState: (path: string, value: any) => void;
  startTimer: (playerIndex: number) => void;
  stopTimer: (playerIndex: number) => void;
  resetPlayer: (playerIndex: number) => void;
  deleteData: () => void;
  submitScore: (session: any) => void;
  exportSessions: (dates: [Date, Date]) => void;
};
const defaultSocketContext: SocketContextType = {
  ip: "",
  port: 9999,
  timeOffset: 0,
  socket: {} as any,
  gameState: {} as any,
  reload: () => {},
  mergeGameState: () => {},
  setInGameState: () => {},
  startTimer: () => {},
  stopTimer: () => {},
  resetPlayer: () => {},
  deleteData: () => {},
  submitScore: () => {},
  exportSessions: () => {},
};
const SocketContext = createContext(defaultSocketContext);

const SocketProvider = (props: { children?: ReactNode }) => {
  const { children } = props;

  const port = 9999;

  const ip = useMemo(() => {
    if (typeof window != undefined) return "";
    const url = new URL(window.location.href);
    url.port = `${port}`;
    url.pathname = "";
  }, [port]);

  const [socket, setSocket] = useState<Socket>();
  const [gameState, updateGameState] = useImmer<GameStateType>({});
  const [timeOffset, setTimeOffset] = useState(0);

  useEffect(() => {
    const socket = io(`${ip}:${port}`);

    socket.on("setState", (arg) => {
      const newState = typeof arg === "string" ? JSON.parse(arg) : arg;
      updateGameState((s) => newState);
    });
    socket.emit("requestState");

    socket.on("timesync", (serverMillis: number) => {
      const offset = serverMillis - DateTime.now().toMillis();
      setTimeOffset(offset);
    });
    socket.emit("timesync");

    setSocket(socket);

    const syncInterval = setInterval(() => {
      socket.emit("timesync");
    }, 60000);

    return () => {
      clearInterval(syncInterval);

      socket.disconnect();
      setSocket(undefined);
    };
  }, [ip, port, updateGameState]);

  const reload = useCallback(() => {
    socket?.emit("requestState");
  }, [socket]);

  const mergeGameState = useCallback(
    (updates) => {
      socket?.emit("mergeState", updates);
    },
    [socket]
  );
  const setInGameState = useCallback(
    (path: string, value: any) => {
      socket?.emit("setInState", { path, value });
    },
    [socket]
  );

  const startTimer = useCallback(
    (playerIndex) => {
      socket?.emit("startTimer", playerIndex);
    },
    [socket]
  );
  const stopTimer = useCallback(
    (playerIndex) => {
      socket?.emit("stopTimer", playerIndex);
    },
    [socket]
  );
  const resetPlayer = useCallback(
    (playerIndex) => {
      socket?.emit("resetPlayer", playerIndex);
    },
    [socket]
  );
  const submitScore = useCallback(
    (session) => {
      socket?.emit("submitScore", session);
    },
    [socket]
  );
  const deleteData = useCallback(() => {
    socket?.emit("deleteData");
  }, [socket]);

  const exportSessions = useCallback(
    (dates?: [Date, Date]) => {
      socket?.emit("exportSessions", dates);
    },
    [socket]
  );

  if (!socket)
    return (
      <div className="w-full h-full flex justify-center items-center">
        Connecting...
      </div>
    );

  return (
    <SocketContext.Provider
      value={{
        ip,
        port,
        socket,
        gameState,
        timeOffset,
        reload,
        mergeGameState,
        setInGameState,
        startTimer,
        stopTimer,
        resetPlayer,
        deleteData,
        submitScore,
        exportSessions,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

const withSocket = (Component: FC) => (props: any) => {
  const { ...rest } = props;

  return (
    <SocketProvider>
      <Component {...rest} />
    </SocketProvider>
  );
};

export { SocketContext, withSocket };
export default SocketProvider;
