import { Button, ButtonProps, TextField } from "@mui/material";
import { Draft } from "immer";
import { DateTime } from "luxon";
import { useRouter } from "next/dist/client/router";
import { ReactNode, useEffect, useMemo, useRef } from "react";
import { useContext } from "use-context-selector";
import { ImmerHook, useImmer } from "use-immer";
import { withMuiTheme } from "../../components/MuiTheme";
import {
  SocketContext,
  withSocket,
  withSocketProps,
} from "../../components/Socket";

type Screen = "form" | "ready" | "playing" | "finished" | "manual";
type FormState = { [s: string]: string };
type SessionState = {
  screen: Screen;
  startTime?: string;
  endTime?: string;
  form?: FormState;
};

const timeFormat = "mm:ss.S";

const FormScreen = (props: { onComplete?: (form: FormState) => void }) => {
  const { onComplete } = props;

  const [form, updateForm] = useImmer<FormState>({});

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
        <div className="flex flex-row space-x-8">
          <TextField
            placeholder="FIRST NAME"
            className="flex-1"
            {...formCtrl("firstName")}
          />
          <TextField
            placeholder="LAST NAME"
            className="flex-1"
            {...formCtrl("lastName")}
          />
        </div>
        <TextField
          placeholder="EMAIL"
          {...formCtrl("email")}
          inputMode="email"
        />
        <TextField placeholder="ADDRESS" {...formCtrl("address")} />
        <div className="flex flex-row space-x-8">
          <TextField
            placeholder="CITY"
            className="flex-1"
            {...formCtrl("city")}
          />
          <TextField placeholder="STATE" {...formCtrl("state")} />
        </div>
        <div className="flex flex-row space-x-8">
          <TextField
            placeholder="ZIP"
            {...formCtrl("zip")}
            inputMode="numeric"
          />
          <TextField
            placeholder="PHONE"
            {...formCtrl("phone")}
            inputMode="tel"
            className="flex-1"
          />
        </div>
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

const ManualScreen = (props: {
  sessionHook: ImmerHook<SessionState>;
  onComplete: () => void;
}) => {
  return <></>;
};
const ManualButton = (props: ButtonProps & { children?: ReactNode }) => {
  const { children, ...rest } = props;

  return (
    <Button {...rest} className="absolute left-8 bottom-8" variant="contained">
      {children}
    </Button>
  );
};

const ReadyScreen = (props: {
  sessionHook: ImmerHook<SessionState>;
  onContinue?: () => void;
}) => {
  const { onContinue, sessionHook } = props;
  const [{ form }, updateSession] = sessionHook;

  return (
    <>
      <div className="text-5xl">{`${form.firstName} ${form.lastName}`}</div>
      <Button variant="contained" onClick={onContinue}>
        READY
      </Button>
      <ManualButton
        onClick={() =>
          updateSession((x) => {
            x.screen = "manual";
          })
        }
      >
        ENTER TIME
      </ManualButton>
    </>
  );
};

const PlayingScreen = (props: {
  sessionHook: ImmerHook<SessionState>;
  onContinue?: () => void;
}) => {
  const { onContinue, sessionHook } = props;
  const [{ form, startTime }, updateSession] = sessionHook;
  const timerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = DateTime.now().diff(DateTime.fromISO(startTime));
      timerRef.current.textContent = diff.toFormat(timeFormat);
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [startTime, timerRef.current]);

  return (
    <>
      <div className="text-5xl">{`${form?.firstName} ${form?.lastName}`}</div>
      <div className="font-bold text-3xl text-gray-500" ref={timerRef}></div>
      <Button onClick={onContinue}>In Session</Button>
      <ManualButton
        onClick={() =>
          updateSession((x) => {
            x.screen = "manual";
          })
        }
      >
        ENTER TIME
      </ManualButton>
    </>
  );
};

const FinishedScreen = (props: {
  sessionHook: ImmerHook<SessionState>;
  onContinue?: () => void;
}) => {
  const { onContinue, sessionHook } = props;
  const [{ form, startTime, endTime }, updateSession] = sessionHook;

  const diff = useMemo(
    () => DateTime.fromISO(endTime).diff(DateTime.fromISO(startTime)),
    [endTime, startTime]
  );

  return (
    <>
      <div className="text-5xl">{`${form?.firstName} ${form?.lastName}`}</div>
      <div className="font-bold text-3xl">{diff.toFormat(timeFormat)}</div>
      <Button variant="contained" onClick={onContinue}>
        Approve
      </Button>
      <ManualButton
        onClick={() =>
          updateSession((x) => {
            x.screen = "manual";
          })
        }
      >
        CHANGE TIME
      </ManualButton>
    </>
  );
};

const TabletPage = () => {
  const router = useRouter();
  const { playerId: playerIdStr } = router.query;
  const playerId = useMemo(
    () => parseInt(playerIdStr as string) - 1,
    [playerIdStr]
  );

  const { gameState, mergeGameState, submitScore } = useContext(SocketContext);
  let session: SessionState = { ...gameState[`player-${playerId}`] } || {
    screen: "form",
    form: undefined,
  };
  const updateSession = (updater: (s: Draft<SessionState>) => void) => {
    updater(session);
    mergeGameState({
      [`player-${playerId}`]: session,
    });
  };

  const { screen } = session;

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col items-center space-y-8">
      <div className="flex flex-row w-full items-center justify-end space-x-8 p-4">
        <div className="text-center font-bold">Player {playerId + 1}</div>
        <Button
          variant="outlined"
          onClick={() =>
            updateSession((x) => {
              x.screen = "form";
              x.form = {};
              x.startTime = "";
              x.endTime = "";
            })
          }
        >
          Reset
        </Button>
      </div>
      <div className="self-center">
        <img src="/images/discount-tire.png" style={{ height: "150px" }} />
      </div>
      {screen === "manual" ? (
        <ManualScreen
          sessionHook={[session, updateSession]}
          onComplete={() =>
            updateSession((x) => {
              x.screen = "form";
            })
          }
        />
      ) : screen === "finished" ? (
        <FinishedScreen
          sessionHook={[session, updateSession]}
          onContinue={() => {
            submitScore(session);
            updateSession((x) => {
              x.startTime = "";
              x.endTime = "";
              x.screen = "form";
              x.form = {};
            });
          }}
        />
      ) : screen === "playing" ? (
        <PlayingScreen
          sessionHook={[session, updateSession]}
          onContinue={() =>
            updateSession((x) => {
              x.endTime = DateTime.now().toISO();
              x.screen = "finished";
            })
          }
        />
      ) : screen === "ready" ? (
        <ReadyScreen
          sessionHook={[session, updateSession]}
          onContinue={() =>
            updateSession((x) => {
              x.startTime = DateTime.now().toISO();
              x.screen = "playing";
            })
          }
        />
      ) : (
        <FormScreen
          onComplete={(x) =>
            updateSession((s) => {
              s.form = { ...x };
              s.startTime = "";
              s.endTime = "";
              s.screen = "ready";
            })
          }
        />
      )}
    </div>
  );
};

export const getServerSideProps = withSocketProps(() => {
  return {};
});

export default withSocket(withMuiTheme(TabletPage));
