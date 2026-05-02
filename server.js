const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// servir el juego (carpeta public)
app.use(express.static("public"));

const players = {};

io.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

  // crear estado del jugador
  players[socket.id] = {
    left: false,
    right: false,
    jump: false
  };

  // inputs
  socket.on("input:keydown", ({ key }) => {
    if (players[socket.id]) {
      players[socket.id][key] = true;
    }
  });

  socket.on("input:keyup", ({ key }) => {
    if (players[socket.id]) {
      players[socket.id][key] = false;
    }
  });

  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);
    delete players[socket.id];
  });
});

// enviar estado 60fps
setInterval(() => {
  io.emit("players:update", players);
}, 1000 / 60);

server.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});