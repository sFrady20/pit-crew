import React, { FC, ReactNode, useCallback, useEffect, useRef } from "react";
import io from "socket.io-client";
import { createContext } from "use-context-selector";
import { useImmer } from "use-immer";
import ip from "ip";
import { merge } from "lodash";

type GameStateType = any;

type SocketContextType = {
  gameState: GameStateType;
  reload: () => void;
  mergeGameState: (updates: any) => void;
  submitScore: (session: any) => void;
};
const defaultSocketContext: SocketContextType = {
  gameState: {} as any,
  reload: () => {},
  mergeGameState: () => {},
  submitScore: () => {},
};
const SocketContext = createContext(defaultSocketContext);

const getSocketProps = () => ({
  ip: ip.address("public", "ipv4"),
  port: 9999,
});

const SocketProvider = (props: {
  ip: string;
  port: number;
  children?: ReactNode;
}) => {
  const { ip, port, children } = props;
  const socketRef = useRef<ReturnType<typeof io>>();

  const [gameState, updateGameState] = useImmer<GameStateType>({});

  useEffect(() => {
    const socket = io(`${ip}:${port}`);

    socket.on("setState", (arg) => {
      const newState = typeof arg === "string" ? JSON.parse(arg) : arg;
      updateGameState((s) => newState);
    });
    socket.emit("requestState");

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = undefined;
    };
  }, [ip, port, updateGameState]);

  const reload = useCallback(() => {
    socketRef.current?.emit("requestState");
  }, [socketRef.current]);

  const mergeGameState = useCallback(
    (updates) => {
      console.log({ updates });
      socketRef.current?.emit("mergeState", updates);
    },
    [socketRef.current]
  );

  const submitScore = useCallback((session) => {
    socketRef.current?.emit("submitScore", session);
  }, []);

  return (
    <SocketContext.Provider
      value={{ gameState, reload, mergeGameState, submitScore }}
    >
      {children}
    </SocketContext.Provider>
  );
};

const withSocket =
  (Component: FC) => (props: ReturnType<typeof getSocketProps>) => {
    const { ip, port, ...rest } = props;

    return (
      <SocketProvider {...{ ip, port }}>
        <Component {...rest} />
      </SocketProvider>
    );
  };

const withSocketProps = (func: () => object) => () =>
  merge(func(), { props: getSocketProps() });

export { SocketContext, withSocket, withSocketProps };
export default SocketProvider;
