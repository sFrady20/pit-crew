import React, { useState } from "react";
import Head from "next/head";
import { SocketContext, withSocket } from "../components/Socket";
import { useContext } from "use-context-selector";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  Divider,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { DateRange, StaticDateRangePicker } from "@mui/lab";
import LuxonAdapter from "@mui/lab/AdapterLuxon";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
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

const fields = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  address: "Address",
  city: "City",
  state: "State",
  zip: "Zip",
  phone: "Phone",
};

const ExportDialog = (props: DialogProps) => {
  const { exportSessions } = useContext(SocketContext);

  const { onClose, ...rest } = props;
  const [dates, setDates] = useState<DateRange<Date>>([null, null]);

  return (
    <Dialog onClose={onClose} {...rest}>
      <DialogContent>
        <LocalizationProvider dateAdapter={LuxonAdapter}>
          <StaticDateRangePicker
            displayStaticWrapperAs="desktop"
            calendars={1}
            startText="Check-in"
            endText="Check-out"
            value={dates}
            onChange={(newValue) => {
              setDates(newValue);
            }}
            renderInput={(startProps, endProps) => (
              <React.Fragment>
                <TextField {...startProps} />
                <Box sx={{ mx: 2 }}> to </Box>
                <TextField {...endProps} />
              </React.Fragment>
            )}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={(e) => onClose && onClose(e, "escapeKeyDown")}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => exportSessions(dates)}>
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Home = () => {
  const { ip, gameState, mergeGameState, setInGameState } =
    useContext(SocketContext);

  const players: any[] = gameState.players || [];
  const df: { [s: string]: boolean | undefined } =
    gameState.disabledFields || {};
  const rf: { [s: string]: boolean | undefined } =
    gameState.requiredFields || {};

  const [isExportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <ExportDialog
        open={isExportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />
      <div className="p-4 space-y-8">
        <div className="flex flex-row justify-between items-center">
          <div className="bg-black hover:bg-white">{ip}</div>
          <div>
            <Button
              variant="contained"
              onClick={() => setExportDialogOpen(true)}
            >
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={80}>Visible</TableCell>
                <TableCell width={100}>Required</TableCell>
                <TableCell>Field Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {map(fields, (label, key) => (
                <TableRow>
                  <TableCell>
                    <Switch
                      checked={!df[key]}
                      onChange={(e) =>
                        setInGameState(
                          `disabledFields.${key}`,
                          !e.target.checked
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rf[key]}
                      onChange={(e) =>
                        setInGameState(
                          `requiredFields.${key}`,
                          e.target.checked
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>{label}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default withSocket(withMuiTheme(Home));
