const express = require("express");
const app = express();

const http = require("http").Server(app);

const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});

const os = require("os");
const path = require("path");

app.use(express.static(path.join(__dirname, ".")));

const PUERTO = 3000;
const MAX_JUGADORES = 4;
const TIMEOUT_RECONEXION = 5000;

// idJugador -> jugador
const jugadores = new Map();

// sockets de pantallas
const pantallas = new Set();

const coloresParaJugadores = [
  "0xff4444",
  "0x44ff44",
  "0x4488ff",
  "0xffff44",
];

function obtenerIPLocal() {
  const interfaces = os.networkInterfaces();

  for (const nombre in interfaces) {
    for (const net of interfaces[nombre]) {
      if (
        net.family === "IPv4" &&
        !net.internal
      ) {
        return net.address;
      }
    }
  }

  return "localhost";
}

const ip = obtenerIPLocal();

app.get("/ip", (req, res) => {
  res.json({ ip });
});

function emitirAPantallas(evento, data) {
  pantallas.forEach((socketId) => {
    io.to(socketId).emit(evento, data);
  });
}

function obtenerSlotLibre() {
  for (let i = 0; i < MAX_JUGADORES; i++) {
    const jugador = jugadores.get(i);

    // slot vacío
    if (!jugador) {
      return i;
    }

    // slot desconectado
    if (!jugador.conectado) {
      if (jugador.timeoutId) {
        clearTimeout(jugador.timeoutId);
      }

      jugadores.delete(i);

      return i;
    }
  }

  return null;
}

function cantidadConectados() {
  let total = 0;

  for (const jugador of jugadores.values()) {
    if (jugador.conectado) {
      total++;
    }
  }

  return total;
}

io.on("connection", (socket) => {
  const tipo = socket.handshake.query.tipo;
  const idJugadorAnterior = socket.handshake.query.idJugador;

  const esPantalla = tipo === "pantalla";
  const esGamepad = tipo === "gamepad";

  console.log(`Nueva conexión: ${socket.id} (${tipo})`);

  // Pantalla
  if (esPantalla) {
    pantallas.add(socket.id);

    console.log("[PANTALLA] Juego conectado");

    // enviar todos los jugadores actuales
    for (const [idJugador, jugador] of jugadores) {
      if (jugador.conectado) {
        socket.emit("nuevoJugador", {
          idJugador,
          color: jugador.color,
        });
      }
    }

    socket.on("disconnect", () => {
      pantallas.delete(socket.id);

      console.log("[PANTALLA] Juego desconectado");
    });

    return;
  }

  // Gamepad
  if (esGamepad) {
    let idJugador = null;

    // Reconexión
    if (idJugadorAnterior !== undefined) {
      const id = parseInt(idJugadorAnterior);

      const jugadorExistente = jugadores.get(id);

      if (
        jugadorExistente &&
        !jugadorExistente.conectado
      ) {
        console.log(`[GAMEPAD] Reconectado jugador ${id}`);

        if (jugadorExistente.timeoutId) {
          clearTimeout(jugadorExistente.timeoutId);
          jugadorExistente.timeoutId = null;
        }

        jugadorExistente.socketId = socket.id;
        jugadorExistente.conectado = true;

        idJugador = id;
      }
    }

    // Nueva conexión (Administración de Slots)
    if (idJugador === null) {
      idJugador = obtenerSlotLibre();

      if (idJugador === null) {
        console.log("[GAMEPAD] Sala llena");

        socket.emit("salaLlena");

        socket.disconnect(true);

        return;
      }

      jugadores.set(idJugador, {
        idJugador,
        socketId: socket.id,
        conectado: true,
        color: coloresParaJugadores[idJugador],
        timeoutId: null,
      });

      console.log(`[GAMEPAD] Nuevo jugador ${idJugador}`);
    }

    const jugador = jugadores.get(idJugador);

    // Notificar al gamepad su ID asignado
    socket.emit("asignarIdJugador", {
      idJugador,
    });

    // Notificar a las pantallas
    emitirAPantallas("nuevoJugador", {
      idJugador,
      color: jugador.color,
    });

    console.log(
      `[GAMEPAD] Jugador ${idJugador} conectado (${cantidadConectados()}/${MAX_JUGADORES})`
    );

    // Administración de eventos del gamepad (Inputs)
    socket.on("message", (msg) => {
      emitirAPantallas("inputDeJugador", {
        idJugador,
        tipoDeEvento: msg.tipo,
        teclaPresionada: msg.tecla,
      });
    });

    // Manejo de errores
    socket.on("error", (err) => {
      console.log(
        `[GAMEPAD] Error jugador ${idJugador}: ${err.message}`
      );
    });

    // Manejo de desconexión
    socket.on("disconnect", () => {
      const jugadorActual = jugadores.get(idJugador);

      if (!jugadorActual) return;

      jugadorActual.conectado = false;

      console.log(
        `[GAMEPAD] Jugador ${idJugador} desconectado`
      );

      emitirAPantallas("jugadorDesconectado", {
        idJugador,
      });

      jugadorActual.timeoutId = setTimeout(() => {
        console.log(
          `[GAMEPAD] Jugador ${idJugador} eliminado por timeout`
        );

        jugadores.delete(idJugador);

        emitirAPantallas("jugadorLiberado", {
          idJugador,
        });
      }, TIMEOUT_RECONEXION);
    });

    return;
  }

  // Manejo de conexiones con tipos desconocidos.
  console.log("Conexión ignorada (tipo inválido)");

  socket.disconnect(true);
});

// Inicio del servidor
http.listen(PUERTO, "0.0.0.0", () => {
  console.log(`Servidor iniciado`);
  console.log(`Juego: http://${ip}:${PUERTO}`);
  console.log(`Gamepads: http://${ip}:${PUERTO}`);
});

// Manejo de cierre del servidor
function cerrarServidor() {
  console.log("Apagando servidor...");

  io.emit("servidorApagado");

  io.sockets.sockets.forEach((socket) => {
    socket.disconnect(true);
  });

  http.close(() => {
    console.log("Servidor cerrado");

    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 3000);
}

process.on("SIGINT", cerrarServidor);
process.on("SIGTERM", cerrarServidor);