import React from "react";
import Head from "next/head";
import {
  SocketContext,
  withSocket,
  withSocketProps,
} from "../components/Socket";
import { useContext } from "use-context-selector";

const Home = withSocket(() => {
  const { gameState, mergeGameState } = useContext(SocketContext);

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <div className="flex flex-col items-center">
        <div className="text-5xl">{gameState?.random}</div>
        <button
          className="bg-blue-500 px-4 py-2 rounded-lg text-white"
          onClick={() => {
            mergeGameState({
              random: Math.random(),
            });
          }}
        >
          Change
        </button>
      </div>
    </>
  );
});

export const getServerSideProps = withSocketProps(() => {
  return {};
});

export default Home;
