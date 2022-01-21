import http from "http";
import express from "express";
import { Server } from "socket.io";

const createSocket = () => {
  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  server.listen(9999, () => {
    console.log("listening on *:9999");
  });

  return io;
};

export default createSocket;
