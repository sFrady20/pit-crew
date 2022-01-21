import http from 'http';
import Express from 'express';
import { Server } from 'socket.io';

const port = 9999;

const createServer = async () => {
  const express = Express();
  const server = http.createServer(express);
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('connected');
  });

  server.listen(port);

  return {
    express,
    server,
    io,
  };
};

const waitForServer = createServer();
const getServer = () => waitForServer;

export default getServer;
