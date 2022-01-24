import React from "react";
import Head from "next/head";
import {
  SocketContext,
  withSocket,
  withSocketProps,
} from "../components/Socket";
import { useContext } from "use-context-selector";
import { TextField } from "@mui/material";

const Home = withSocket(() => {
  const { gameState, mergeGameState } = useContext(SocketContext);

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <div className="flex flex-col items-center py-12 px-8 space-y-8">
        <TextField
          type="number"
          value={gameState.numPlayers || null}
          label={"Number of Players"}
          onChange={(e) =>
            mergeGameState({ numPlayers: parseInt(e.target.value) })
          }
        />
      </div>
    </>
  );
});

export const getServerSideProps = withSocketProps(() => {
  return {};
});

export default Home;
