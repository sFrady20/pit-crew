import React from "react";
import Head from "next/head";
import { SocketContext, withSocket } from "../components/Socket";
import { useContext } from "use-context-selector";
import { Button, Divider, Switch } from "@mui/material";
import { dropRight, map } from "lodash";
import Timer from "../components/Timer";
import { withMuiTheme } from "../components/MuiTheme";

const Player = (props: { index: number }) => {
  const { gameState, setInGameState } = useContext(SocketContext);

  const { index } = props;
  const session = gameState[`player-${index}`] || {};

  return (
    <div
      className={`flex flex-row space-x-1 items-center ${
        !(index % 2) && "bg-gray-400"
      } py-2 px-4`}
    >
      <div className="flex-1 font-bold">{`Player ${index + 1}`}</div>
      <div className="flex-1">{session.phase}</div>
      <div className="flex-1">{session.form?.firstName}</div>
      <div className="flex-1">
        <Timer playerIndex={index} />
      </div>
      <div className="flex-1">
        <Button
          variant="outlined"
          className="h-4"
          color="error"
          onClick={() => setInGameState(`player-${index}`, null)}
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

const Home = () => {
  const { ip, gameState, mergeGameState, setInGameState, exportSessions } =
    useContext(SocketContext);

  const players: any[] = gameState.players || [];
  const df: { [s: string]: boolean | undefined } =
    gameState.disabledFields || {};

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <div className="p-4 space-y-8">
        <div className="flex flex-row justify-between items-center">
          <div className="bg-black hover:bg-white">{ip}</div>
          <div>
            <Button variant="contained" onClick={() => exportSessions()}>
              Export CSV
            </Button>
          </div>
        </div>
        <Divider>Players</Divider>
        <div className="flex flex-col space-y-4">
          <div>
            {map(players, (player, i) => (
              <Player index={i} />
            ))}
          </div>
          <div className="flex flex-row space-x-2">
            <Button
              variant="contained"
              onClick={() => {
                mergeGameState({
                  players: [...players, { name: `Player ${players.length}` }],
                });
              }}
            >
              Add Player
            </Button>
            {players.length > 0 && (
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  setInGameState("players", dropRight(players, 1));
                }}
              >
                Remove Player
              </Button>
            )}
          </div>
        </div>
        <Divider>Fields</Divider>
        <div className="">
          <div className="flex flex-row items-center space-x-8">
            <Switch
              checked={!df.firstName}
              onChange={(e) =>
                setInGameState(`disabledFields.firstName`, !e.target.checked)
              }
            />
            <div>First Name</div>
          </div>
          <div className="flex flex-row items-center space-x-8">
            <Switch
              checked={!df.lastName}
              onChange={(e) =>
                setInGameState(`disabledFields.lastName`, !e.target.checked)
              }
            />
            <div>Last Name</div>
          </div>
          <div className="flex flex-row items-center space-x-8">
            <Switch
              checked={!df.email}
              onChange={(e) =>
                setInGameState(`disabledFields.email`, !e.target.checked)
              }
            />
            <div>Email</div>
          </div>
          <div className="flex flex-row items-center space-x-8">
            <Switch
              checked={!df.address}
              onChange={(e) =>
                setInGameState(`disabledFields.address`, !e.target.checked)
              }
            />
            <div>Address</div>
          </div>
          <div className="flex flex-row items-center space-x-8">
            <Switch
              checked={!df.city}
              onChange={(e) =>
                setInGameState(`disabledFields.city`, !e.target.checked)
              }
            />
            <div>City</div>
          </div>
          <div className="flex flex-row items-center space-x-8">
            <Switch
              checked={!df.state}
              onChange={(e) =>
                setInGameState(`disabledFields.state`, !e.target.checked)
              }
            />
            <div>State</div>
          </div>
          <div className="flex flex-row items-center space-x-8">
            <Switch
              checked={!df.zip}
              onChange={(e) =>
                setInGameState(`disabledFields.zip`, !e.target.checked)
              }
            />
            <div>Zip</div>
          </div>
          <div className="flex flex-row items-center space-x-8">
            <Switch
              checked={!df.phone}
              onChange={(e) =>
                setInGameState(`disabledFields.phone`, !e.target.checked)
              }
            />
            <div>Phone</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default withSocket(withMuiTheme(Home));
