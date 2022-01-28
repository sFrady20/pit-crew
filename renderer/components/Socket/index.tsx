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

type GameStateType = any;

type SocketContextType = {
  ip: string;
  port: number;
  socket: Socket;
  gameState: GameStateType;
  reload: () => void;
  mergeGameState: (updates: any) => void;
  setInGameState: (path: string, value: any) => void;
  submitScore: (session: any) => void;
  exportSessions: () => void;
};
const defaultSocketContext: SocketContextType = {
  ip: "",
  port: 9999,
  socket: {} as any,
  gameState: {} as any,
  reload: () => {},
  mergeGameState: () => {},
  setInGameState: () => {},
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

  console.log(ip);

  const [socket, setSocket] = useState<Socket>();
  const [gameState, updateGameState] = useImmer<GameStateType>({});

  useEffect(() => {
    const socket = io(`${ip}:${port}`);

    socket.on("setState", (arg) => {
      const newState = typeof arg === "string" ? JSON.parse(arg) : arg;
      updateGameState((s) => newState);
    });
    socket.emit("requestState");

    setSocket(socket);

    return () => {
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

  const submitScore = useCallback(
    (session) => {
      socket?.emit("submitScore", session);
    },
    [socket]
  );

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
        reload,
        mergeGameState,
        setInGameState,
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
