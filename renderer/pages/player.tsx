import {
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  TextField,
} from "@mui/material";
import { Draft } from "immer";
import { DateTime, Duration } from "luxon";
import { ReactNode, useEffect, useMemo, useState } from "react";
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
};

const FormScreen = (props: { onComplete?: (form: FormState) => void }) => {
  const { onComplete } = props;
  const { gameState } = useContext(SocketContext);

  const [form, updateForm] = useImmer<FormState>({});
  const df = gameState.disabledFields || {};

  const formCtrl = (key: string) => ({
    value: form[key],
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
                placeholder="FIRST NAME"
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
        {!df.email && (
          <TextField
            placeholder="EMAIL"
            {...formCtrl("email")}
            inputMode="email"
          />
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
      </div>
      <Button
        variant="contained"
        className="self-center"
        onClick={() => onComplete && onComplete(form)}
      >
        START
      </Button>
    </>
  );
};

const ManualButton = (props: ButtonProps & { children?: ReactNode }) => {
  const { children, className, ...rest } = props;

  return (
    <div className={`${className} fixed left-8 bottom-8`}>
      <Button {...rest} variant="contained">
        {children}
      </Button>
    </div>
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
    window.addEventListener("hashchange", listener);
    return () => {
      window.removeEventListener("hashchange", listener);
    };
  }, [setPlayerId]);

  const { gameState, mergeGameState, submitScore } = useContext(SocketContext);
  let session: SessionState = { ...gameState[`player-${playerId}`] } || {
    phase: "form",
    form: undefined,
  };
  const updateSession = (updater: (s: Draft<SessionState>) => void) => {
    updater(session);
    mergeGameState({
      [`player-${playerId}`]: session,
    });
  };

  const { form, phase } = session;

  const [isManualDialogOpen, setManualDialogOpen] = useState(false);
  useEffect(() => {
    if (phase === "form") setManualDialogOpen(false);
  }, [phase, setManualDialogOpen]);

  return (
    <div className="w-screen h-screen flex flex-col items-center relative space-y-12">
      <div className="flex flex-row w-full items-center justify-end space-x-8 p-4">
        <div className="text-center font-bold">Player {playerId + 1}</div>
      </div>
      <div className="self-center">
        <img src="/images/discount-tire.png" style={{ height: "150px" }} />
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
              updateSession((x) => {
                x.startTime = "";
                x.endTime = "";
                x.phase = "form";
                x.form = null;
              });
            }}
            sx={{
              fontSize: "50px",
              px: "2rem",
            }}
          >
            Approve
          </Button>
          <ManualButton onClick={() => setManualDialogOpen((s) => !s)}>
            CHANGE TIME
          </ManualButton>
        </>
      ) : phase === "playing" ? (
        <>
          <Button
            onClick={() =>
              updateSession((x) => {
                x.endTime = DateTime.now().toISO();
                x.phase = "finished";
              })
            }
            sx={{
              fontSize: "50px",
              px: "2rem",
            }}
          >
            In Session
          </Button>
          <ManualButton onClick={() => setManualDialogOpen((s) => !s)}>
            ENTER TIME
          </ManualButton>
        </>
      ) : phase === "ready" ? (
        <>
          <Button
            variant="contained"
            onClick={() =>
              updateSession((x) => {
                x.startTime = DateTime.now().toISO();
                x.phase = "playing";
              })
            }
            sx={{
              fontSize: "50px",
              px: "2rem",
            }}
          >
            READY
          </Button>
          <ManualButton onClick={() => setManualDialogOpen((s) => !s)}>
            ENTER TIME
          </ManualButton>
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
