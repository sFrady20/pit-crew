import { app, shell } from "electron";
import serve from "electron-serve";
import { merge, sortBy } from "lodash";
import { createWindow, createSocket } from "./helpers";
import syncFile from "./helpers/file";
import { DateTime } from "luxon";

const isProd: boolean = process.env.NODE_ENV === "production";
const paths = {
  state: "./dt-pit-state.data",
  leaderboard: "./dt-pit-leaders.data",
  sessions: "./dt-pit-sessions.data",
  export: "./dt-pit-export.data",
};

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  const io = createSocket();

  //setup game state
  {
    let { data, enqueueSave } = syncFile<any>(paths.state, {});
    io.on("connection", (socket) => {
      socket.on("requestState", () => {
        socket.emit("setState", data);
      });
      socket.on("mergeState", (arg) => {
        const updates = typeof arg === "string" ? JSON.parse(arg) : arg;
        merge(data, updates);
        io.emit("setState", data);
        enqueueSave();
      });
    });
  }

  //setup leaderboard
  {
    let { data, enqueueSave } = syncFile<any[]>(paths.leaderboard, []);

    io.on("connection", (socket) => {
      socket.on("requestLeaderboard", () => {
        socket.emit("setLeaderboard", data);
      });
      socket.on("submitScore", (arg) => {
        const score = typeof arg === "string" ? JSON.parse(arg) : arg;
        const submissionTime = DateTime.now().toISOTime();
        data.push({
          ...score,
          submissionTime,
        });
        sortBy(data, (d) =>
          DateTime.fromISO(d.endTime)
            .diff(DateTime.fromISO(d.startTime))
            .toMillis()
        );
        //todo
        enqueueSave();
      });
    });
  }

  //setup sessions
  {
    let { data, enqueueSave } = syncFile<any[]>(paths.sessions, []);

    io.on("connection", (socket) => {
      socket.on("exportSessions", () => {
        //TODO generate csv
        shell.showItemInFolder(paths.export);
      });
      socket.on("submitScore", (arg) => {
        const score = typeof arg === "string" ? JSON.parse(arg) : arg;
        const submissionTime = DateTime.now().toISOTime();
        data.push({
          ...score,
          submissionTime,
        });
        enqueueSave();
      });
    });
  }

  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
  });

  if (isProd) {
    await mainWindow.loadURL("app://./index.html");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on("window-all-closed", () => {
  app.quit();
});
