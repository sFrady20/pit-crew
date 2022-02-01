import { app, shell } from "electron";
import { each, filter, forEach, map, merge, set } from "lodash";
import { createWindow } from "./helpers";
import syncFile from "./helpers/file";
import { DateTime } from "luxon";
import SerialPort, { PortInfo } from "serialport";
import Readline from "@serialport/parser-readline";
import { stringify } from "csv-stringify/sync";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import http, { Server } from "http";
import { Server as SocketServer } from "socket.io";
import serve from "serve-handler";

const isProd: boolean = process.env.NODE_ENV === "production";

const paths = {
  state: "./dt-pit-state.data",
  leaderboard: "./dt-pit-leaders.data",
  sessions: "./dt-pit-sessions.data",
  export: join(dirname(app.getAppPath()), "./dt-pit-export.csv"),
};

let server: Server;

if (isProd) {
  server = http.createServer((req, res) => {
    return serve(req, res, { public: "app" });
  });
} else {
  server = http.createServer();
}

const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

server.listen(9999, () => {
  console.log("listening on *:9999");
});

(async () => {
  //setup game state
  const { data: gameState, enqueueSave: enqueueSaveGameState } = syncFile<any>(
    paths.state,
    {}
  );
  //setup sessions
  const { data: sessions, enqueueSave: enqueueSaveSessions } = syncFile<any[]>(
    paths.sessions,
    []
  );

  //game logic
  const submitScore = (arg: any) => {
    const score = typeof arg === "string" ? JSON.parse(arg) : arg;
    const submissionTime = DateTime.now().toISOTime();

    //save session
    const newSession = {
      ...score,
      submissionTime,
    };
    sessions.push(newSession);
    sessions.sort((a, b) => {
      const aDiff = DateTime.fromISO(a.endTime)
        .diff(DateTime.fromISO(a.startTime))
        .toMillis();
      const bDiff = DateTime.fromISO(b.endTime)
        .diff(DateTime.fromISO(b.startTime))
        .toMillis();
      return aDiff === bDiff ? 0 : aDiff > bDiff ? 1 : -1;
    });

    io.emit("setLeaderboard", sessions);
    enqueueSaveSessions();

    io.emit("showNewScore", [sessions.indexOf(newSession), newSession]);
  };

  const generateCSV = (dates: [string, string]) => {
    console.log([
      DateTime.fromISO(dates[0]).toISODate(),
      DateTime.fromISO(dates[1]).toISODate(),
    ]);

    const body = stringify(
      filter(
        map(sessions, (session) => ({
          ...session.form,
          date: DateTime.fromISO(session.submissionTime).toISODate(),
          time: DateTime.fromISO(session.submissionTime).toFormat("t"),
          score: DateTime.fromISO(session.endTime)
            .diff(DateTime.fromISO(session.startTime))
            .toFormat("mm:ss.S"),
        })),
        (x) =>
          x.date > DateTime.fromISO(dates[0]).toISODate() &&
          x.date < DateTime.fromISO(dates[1]).toISODate()
      ),
      {
        header: true,
        columns: [
          "firstName",
          "lastName",
          "email",
          "address",
          "phone",
          "city",
          "state",
          "zip",
          "date",
          "time",
          "score",
        ],
      }
    );
    writeFileSync(paths.export, body);
  };

  const startTimer = (playerIndex: number) => {
    const playerData = gameState[`player-${playerIndex}`] || {};
    gameState[`player-${playerIndex}`] = playerData;

    if (playerData.phase === "ready") {
      playerData.phase = "playing";
      playerData.startTime = DateTime.now().toISO();
    }

    io.emit("setState", gameState);
  };

  const stopTimer = (playerIndex: number) => {
    const playerData = gameState[`player-${playerIndex}`] || {};
    gameState[`player-${playerIndex}`] = playerData;

    if (playerData.phase === "playing") {
      playerData.phase = "finished";
      playerData.endTime = DateTime.now().toISO();
    }

    io.emit("setState", gameState);
  };

  const resetPlayer = (playerIndex: number) => {
    delete gameState[`player-${playerIndex}`];
    io.emit("setState", gameState);
  };

  const handleSerialData = (input: string) => {
    const matches = /(unit)?\s*(\d+)\s*(open|opened|close|closed)/gi.exec(
      input
    );
    const playerIndex = parseInt(matches[2]) - 1;
    const isOpen =
      matches[3]?.toLowerCase() === "open" ||
      matches[3]?.toLowerCase() === "opened";

    const playerData = gameState[`player-${playerIndex}`] || {};
    gameState[`player-${playerIndex}`] = playerData;

    if (isOpen && playerData.phase === "ready" && !playerData.manual) {
      console.log(`Player ${playerIndex + 1} start!`);
      //start
      playerData.phase = "playing";
      playerData.startTime = DateTime.now().toISO();

      io.emit("setState", gameState);
      enqueueSaveGameState();
    }
    if (!isOpen && playerData.phase === "playing" && !playerData.manual) {
      console.log(`Player ${playerIndex + 1} STOP!`);
      //end
      playerData.phase = "finished";
      playerData.endTime = DateTime.now().toISO();
      //
      io.emit("setState", gameState);
      enqueueSaveGameState();
    }
  };

  io.on("connection", (socket) => {
    socket.on("requestState", () => {
      socket.emit("setState", gameState);
    });
    socket.on("mergeState", (arg) => {
      const updates = typeof arg === "string" ? JSON.parse(arg) : arg;
      merge(gameState, updates);
      io.emit("setState", gameState);
      enqueueSaveGameState();
    });
    socket.on("setInState", (arg) => {
      const { path, value } = typeof arg === "string" ? JSON.parse(arg) : arg;
      set(gameState, path, value);
      io.emit("setState", gameState);
      enqueueSaveGameState();
    });

    socket.on("timesync", () => {
      socket.emit("timesync", DateTime.now().toMillis());
    });

    socket.on("startTimer", startTimer);
    socket.on("stopTimer", stopTimer);
    socket.on("resetPlayer", resetPlayer);
    socket.on("submitScore", submitScore);

    socket.on("requestLeaderboard", () => {
      socket.emit("setLeaderboard", sessions);
    });

    socket.on("exportSessions", (dates: [string, string]) => {
      generateCSV(dates);
      shell.showItemInFolder(paths.export);
    });

    socket.on("deleteData", () => {
      sessions.length = 0;
      enqueueSaveSessions();
      socket.emit("setLeaderboard", sessions);
    });
  });

  //connect to (all) serial ports
  const ports = (await SerialPort.list()) || [];
  each(ports, (portInfo: PortInfo) => {
    const port = new SerialPort(portInfo.path, {
      autoOpen: false,
      baudRate: 9600,
    });
    const openPort = () => {
      port.open((err) => {
        if (err) {
          console.error(err);
          setTimeout(openPort, 10000);
          return;
        }
        const parser = port.pipe(new Readline({ delimiter: "\r\n" }));
        parser.on("data", (input) => {
          console.log(input);
          handleSerialData(input);
          io.emit("serialData", input);
        });
      });
    };
    openPort();
  });

  //start electron
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
  });

  if (isProd) {
    const port = process.argv[2];
    //await mainWindow.loadURL("app://./admin.html");
    await mainWindow.loadURL(`http://localhost:9999/admin`);
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/admin`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on("window-all-closed", () => {
  app.quit();
});
