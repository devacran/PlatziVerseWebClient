//Este servidor envia informacion real time a la app web
"use strict";

const debug = require("debug")("platziverse:web");
const http = require("http");
const path = require("path");
const express = require("express");
const chalk = require("chalk");
const socketio = require("socket.io");
const port = process.env.PORT || 8080;
const app = express();
const proxy = require("./proxy");
const PlatziVerseAgent = require("platziverseagent");
const server = http.createServer(app);
const io = socketio(server); //para montar una ruta en el servidor express
// const proxy = require("./proxy");
const { pipe } = require("./utils");

app.use(express.static(path.join(__dirname, "public")));
app.use("/", proxy);
const agent = new PlatziVerseAgent();
// Socket.io / WebSockets
io.on("connect", socket => {
  debug(`Connected ${socket.id}`);
  //Este pipe se encarga de retransmitir los mensajes del agente al socket
  pipe(agent, socket);
});

// Express Error Handler
app.use((err, req, res, next) => {
  debug(`Error: ${err.message}`);

  if (err.message.match(/not found/)) {
    return res.status(404).send({ error: err.message });
  }

  res.status(500).send({ error: err.message });
});

function handleFatalError(err) {
  console.error(`${chalk.red("[fatal error]")} ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}

process.on("uncaughtException", handleFatalError);
process.on("unhandledRejection", handleFatalError);

server.listen(port, () => {
  agent.connect();
  console.log(
    `${chalk.green("[platziverse-web]")} server listening on port ${port}`
  );
});
