import { app } from "electron";
import serve from "electron-serve";
import { merge } from "lodash";
import { createWindow, createSocket } from "./helpers";

const isProd: boolean = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  const io = createSocket();

  const gameState: any = {};

  io.on("connection", (socket) => {
    console.log("connected");

    socket.on("requestState", () => {
      socket.emit("setState", gameState);
    });

    socket.on("mergeState", (arg) => {
      const updates = typeof arg === "string" ? JSON.parse(arg) : arg;
      merge(gameState, updates);
      io.emit("setState", gameState);
    });

    socket.on("disconnect", () => {
      console.log("disconnected");
    });
  });

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
