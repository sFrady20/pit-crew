import {
  Autocomplete,
  Button,
  Switch,
  Dialog,
  DialogContent,
  DialogProps,
  TextField,
} from "@mui/material";
import { Draft } from "immer";
import { forEach, some, values } from "lodash";
import { DateTime, Duration } from "luxon";
import { useEffect, useMemo, useState } from "react";
import ReactInputMask from "react-input-mask";
import { useContext } from "use-context-selector";
import { useImmer } from "use-immer";
import { withMuiTheme } from "../components/MuiTheme";
import { SocketContext, withSocket } from "../components/Socket";
import Timer from "../components/Timer";

type Phase = "form" | "ready" | "playing" | "finished" | "manual";
type FormState = { [s: string]: string };
type SessionState = {
  phase: Phase;
  startTime?: string;
  endTime?: string;
  form?: FormState;
  manual?: boolean;
};

const FormScreen = (props: { onComplete?: (form: FormState) => void }) => {
  const { onComplete } = props;
  const { gameState } = useContext(SocketContext);

  const [form, updateForm] = useImmer<FormState>({});
  const df = gameState.disabledFields || {};
  const rf = gameState.requiredFields || {};

  const [requirements, setRequirements] = useState<{ [s: string]: any }>({});

  const formCtrl = (key: string) => ({
    value: form[key],
    error: requirements[key],
    onChange: (e) => {
      const val = e.target.value;
      updateForm((x) => {
        x[key] = val;
      });
    },
  });

  return (
    <>
      <div className="flex flex-col w-full space-y-8 px-8">
        {(!df.firstName || !df.lastName) && (
          <div className="flex flex-row space-x-8">
            {!df.firstName && (
              <TextField
                placeholder={`FIRST NAME`}
                className="flex-1"
                {...formCtrl("firstName")}
              />
            )}
            {!df.lastName && (
              <TextField
                placeholder="LAST NAME"
                className="flex-1"
                {...formCtrl("lastName")}
              />
            )}
          </div>
        )}
        {(!df.email || !df.age) && (
          <div className="flex flex-row space-x-8">
            {!df.email && (
              <TextField
                placeholder="EMAIL"
                {...formCtrl("email")}
                inputMode="email"
                className="flex-1"
              />
            )}
            {!df.age && (
              <TextField
                placeholder="AGE"
                {...formCtrl("age")}
                type="number"
                inputMode="numeric"
              />
            )}
          </div>
        )}
        {!df.address && (
          <TextField placeholder="ADDRESS" {...formCtrl("address")} />
        )}
        {(!df.city || !df.state) && (
          <div className="flex flex-row space-x-8">
            {!df.city && (
              <TextField
                placeholder="CITY"
                className="flex-1"
                {...formCtrl("city")}
              />
            )}
            {!df.state && (
              <TextField placeholder="STATE" {...formCtrl("state")} />
            )}
          </div>
        )}
        {(!df.zip || !df.phone) && (
          <div className="flex flex-row space-x-8">
            {!df.zip && (
              <TextField
                placeholder="ZIP"
                {...formCtrl("zip")}
                inputMode="numeric"
              />
            )}
            {!df.phone && (
              <TextField
                placeholder="PHONE"
                {...formCtrl("phone")}
                inputMode="tel"
                className="flex-1"
              />
            )}
          </div>
        )}
        {(!df.vehicles || !df.store) && (
          <div className="flex flex-row space-x-8">
            {!df.store && (
              <TextField
                placeholder="Store"
                className="flex-1"
                {...formCtrl("store")}
              />
            )}
            {!df.vehicles && (
              <TextField
                placeholder="How many vehicles are in your household?"
                {...formCtrl("vehicles")}
                inputMode="numeric"
                type="number"
                className="flex-1"
              />
            )}
          </div>
        )}
        {!df.familiar && (
          <div className="flex flex-row space-x-8">
            {!df.familiar && (
              <Autocomplete
                options={["I'm a customer", "Somewhat", "Not at all"]}
                className="flex-1"
                value={form.familiar}
                onChange={(e, val) => {
                  updateForm((f) => {
                    f.familiar = val;
                  });
                }}
                renderInput={(props) => (
                  <TextField
                    error={!!requirements["familiar"]}
                    {...props}
                    placeholder="How familiar are you with Discount Tire"
                  />
                )}
              />
            )}
          </div>
        )}
      </div>
      <Button
        variant="contained"
        className="self-center"
        onClick={() => {
          let req: typeof requirements = {};
          forEach(rf, (isRequired, field) => {
            if (!isRequired) return;
            if (!form[field]) req[field] = true;
          });
          if (some(values(req))) {
            setRequirements(req);
          } else {
            onComplete && onComplete(form);
          }
        }}
        sx={{
          fontSize: "20px",
          px: "2rem",
        }}
      >
        START
      </Button>
    </>
  );
};

const ManualDialog = (
  props: DialogProps & { onSubmit?: (time: Duration) => void }
) => {
  const { onClose, onSubmit, ...rest } = props;

  const [time, setTime] = useState("");

  const duration = useMemo(() => {
    console.log({ time, min: time.slice(0, 2), sec: time.slice(3, 5) });
    try {
      return Duration.fromObject({
        minutes: parseInt(time.slice(0, 2)),
        seconds: parseInt(time.slice(3, 5)),
        milliseconds: parseInt(time.slice(6, 9)),
      });
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }, [time]);

  return (
    <Dialog onClose={onClose} {...rest}>
      <DialogContent>
        <div className="flex flex-col space-y-12 items-center px-8 py-12">
          <div className="flex flex-col  items-center space-y-4">
            <div className="text-lg font-bold">MANUALLY ENTER TIME</div>
            <ReactInputMask
              mask={"99:99.999"}
              value={time}
              alwaysShowMask={true}
              //@ts-ignore
              maskChar={"0"}
              onChange={(e) => setTime(e.target.value)}
            >
              {() => (
                <TextField
                  error={!duration}
                  sx={{ input: { fontSize: "30px" } }}
                />
              )}
            </ReactInputMask>
          </div>
          <div className="flex flex-row space-x-4">
            <Button
              onClick={(e) => onClose && onClose(e, "escapeKeyDown")}
              sx={{
                fontSize: "20px",
                px: "2rem",
              }}
            >
              CANCEL
            </Button>
            <Button
              variant="contained"
              onClick={(e) => {
                onSubmit && onSubmit(duration);
                setTime("");
              }}
              sx={{
                fontSize: "20px",
                px: "2rem",
              }}
            >
              SUBMIT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TabletPage = () => {
  //get player id from hash (and listen for changes)
  const [playerId, setPlayerId] = useState(0);
  useEffect(() => {
    const listener = () => {
      setPlayerId(parseInt(window.location.hash.slice(1)) - 1);
    };
    listener();
    window.addEventListener("hashchange", listener);
    return () => {
      window.removeEventListener("hashchange", listener);
    };
  }, [setPlayerId]);

  const {
    gameState,
    setInGameState,
    startTimer,
    stopTimer,
    resetPlayer,
    submitScore,
  } = useContext(SocketContext);
  let session: SessionState = { ...gameState[`player-${playerId}`] } || {
    phase: "form",
    form: undefined,
  };
  const updateSession = (updater: (s: Draft<SessionState>) => void) => {
    updater(session);
    setInGameState(`player-${playerId}`, session);
  };

  const { form, phase } = session;

  const [isManualDialogOpen, setManualDialogOpen] = useState(false);
  useEffect(() => {
    if (phase === "form") setManualDialogOpen(false);
  }, [phase, setManualDialogOpen]);

  return (
    <div className="w-screen h-screen flex flex-col items-center relative space-y-12">
      <div className="flex flex-row w-full items-center justify-end space-x-8 px-4 py-2">
        <div className="text-center font-bold">Player {playerId + 1}</div>
      </div>
      <div className="self-center">
        <img
          src="/images/discount-tire.png"
          style={{ height: "150px" }}
          draggable={false}
        />
      </div>
      {phase !== "form" && !!phase && (
        <div className="space-y-5 flex-col flex items-center">
          <div className={`text-5xl font-bold`}>{`${form?.firstName || ""} ${
            form?.lastName || ""
          }`}</div>
          <Timer
            playerIndex={playerId}
            className={`font-bold text-5xl ${
              phase !== "finished" ? "text-gray-500" : ""
            }`}
          />
        </div>
      )}
      {phase === "finished" ? (
        <>
          <Button
            variant="contained"
            onClick={() => {
              submitScore(session);
              resetPlayer(playerId);
            }}
            sx={{
              fontSize: "50px",
              px: "2rem",
            }}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              submitScore(session);
              updateSession((s) => {
                s.phase = "ready";
                s.startTime = undefined;
                s.endTime = undefined;
              });
            }}
            sx={{
              fontSize: "30px",
              px: "2rem",
            }}
          >
            Play Again
          </Button>
          <div className={`fixed left-8 bottom-8`}>
            <Button
              variant="contained"
              onClick={() => setManualDialogOpen((s) => !s)}
            >
              CHANGE TIME
            </Button>
          </div>
        </>
      ) : phase === "playing" ? (
        <>
          {session.manual ? (
            <Button
              variant="contained"
              onClick={() => stopTimer(playerId)}
              sx={{
                fontSize: "50px",
                px: "2rem",
              }}
            >
              STOP
            </Button>
          ) : (
            <div className="bg-gray-200 text-gray-500 px-12 py-10 text-[50px] rounded-lg font-bold">
              In Session
            </div>
          )}
          <div className={`fixed left-8 bottom-8`}>
            <Button
              variant="contained"
              onClick={() => setManualDialogOpen((s) => !s)}
            >
              ENTER TIME
            </Button>
          </div>
          <div className={"fixed right-8 bottom-8"}>
            <Switch
              checked={session.manual || false}
              onChange={(e, ch) => {
                updateSession((s) => {
                  s.manual = ch;
                });
              }}
            />
            Tablet Timer
          </div>
        </>
      ) : phase === "ready" ? (
        <>
          {session.manual ? (
            <Button
              variant="contained"
              onClick={() => startTimer(playerId)}
              sx={{
                fontSize: "50px",
                px: "2rem",
              }}
            >
              START
            </Button>
          ) : (
            <div className="bg-gray-200 text-gray-500 px-12 py-10 text-[50px] rounded-lg font-bold">
              READY
            </div>
          )}
          <div className={`fixed left-8 bottom-8`}>
            <Button
              variant="contained"
              onClick={() => setManualDialogOpen((s) => !s)}
            >
              ENTER TIME
            </Button>
          </div>
          <div className={"fixed right-8 bottom-8"}>
            <Switch
              checked={session.manual || false}
              onChange={(e, ch) => {
                updateSession((s) => {
                  s.manual = ch;
                });
              }}
            />
            Tablet Timer
          </div>
        </>
      ) : (
        <FormScreen
          onComplete={(x) =>
            updateSession((s) => {
              s.form = { ...x };
              s.startTime = "";
              s.endTime = "";
              s.phase = "ready";
            })
          }
        />
      )}
      <ManualDialog
        open={isManualDialogOpen}
        onClose={(e, reason) =>
          reason !== "backdropClick" && setManualDialogOpen(false)
        }
        onSubmit={(time) => {
          const now = DateTime.now();
          updateSession((s) => {
            s.startTime = now.minus(time).toISO();
            s.endTime = now.toISO();
            s.phase = "finished";
          });
          setManualDialogOpen(false);
        }}
      />
    </div>
  );
};

export default withSocket(withMuiTheme(TabletPage));
