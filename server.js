const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Matter = require("matter-js");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { transports: ["websocket"] });

app.use(express.static("public"));

// Configuración del Motor
const engine = Matter.Engine.create();
const world = engine.world;
engine.gravity.y = 1.5;

// Estado del Juego
let currentLevel = 1;
let players = {};
let levelEntities = [];
let keyCarrierId = null; // Quién lleva la llave
const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#F333FF"];

// --- LÓGICA DE NIVELES ---
function loadLevel(num) {
    Matter.World.clear(world);
    levelEntities = [];
    keyCarrierId = null;

    if (num === 1) {
        // Nivel 1: Suelo y Llave lejos
        createBox(400, 380, 800, 40, "ground", true);
        createBox(700, 300, 20, 20, "key", false); // La Llave
        createBox(750, 320, 60, 100, "door", true);
    } else {
        // Nivel 2: Plataformas altas (Requiere apilarse)
        createBox(400, 380, 800, 40, "ground", true);
        createBox(600, 150, 150, 20, "platform", true); // Plataforma alta
        createBox(600, 100, 20, 20, "key", false);      // Llave en la plataforma
        createBox(750, 320, 60, 100, "door", true);
    }

    // Re-añadir jugadores al mundo
    Object.values(players).forEach(p => {
        Matter.Body.setPosition(p.body, { x: 100, y: 300 });
        Matter.World.add(world, p.body);
    });
}

function createBox(x, y, w, h, type, isStatic) {
    const body = Matter.Bodies.rectangle(x, y, w, h, { isStatic, friction: 0.5 });
    body.label = type;
    body.w = w; body.h = h;
    levelEntities.push(body);
    Matter.World.add(world, body);
}

// --- GESTIÓN DE SOCKETS ---
io.on("connection", (socket) => {
    if (Object.keys(players).length >= 4) return socket.disconnect();

    const id = socket.id;
    const body = Matter.Bodies.rectangle(100, 300, 30, 30, { 
        inertia: Infinity, 
        friction: 0.2 
    });
    body.label = "player";

    players[id] = {
        body,
        color: COLORS[Object.keys(players).length],
        input: { left: false, right: false, jump: false }
    };

    Matter.World.add(world, body);
    loadLevel(currentLevel);

    socket.on("input:update", (data) => {
        if (players[id]) players[id].input = data;
    });

    socket.on("disconnect", () => {
        if (players[id]) Matter.World.remove(world, players[id].body);
        delete players[id];
        if (keyCarrierId === id) keyCarrierId = null;
    });
});

// --- LOOP DE FÍSICA (60 FPS) ---
setInterval(() => {
    Object.keys(players).forEach(id => {
        const p = players[id];
        const moveForce = 0.002;

        if (p.input.left) Matter.Body.applyForce(p.body, p.body.position, { x: -moveForce, y: 0 });
        if (p.input.right) Matter.Body.applyForce(p.body, p.body.position, { x: moveForce, y: 0 });
        
        // Salto: Solo si la velocidad Y es cercana a 0 (está sobre algo)
        if (p.input.jump && Math.abs(p.body.velocity.y) < 0.1) {
            Matter.Body.setVelocity(p.body, { x: p.body.velocity.x, y: -10 });
        }
    });

    // Lógica de la Llave
    const keyBody = levelEntities.find(e => e.label === "key");
    if (keyBody) {
        if (!keyCarrierId) {
            // Buscar si alguien la toca
            Object.keys(players).forEach(id => {
                if (Matter.Bounds.overlaps(players[id].body.bounds, keyBody.bounds)) {
                    keyCarrierId = id;
                }
            });
        } else {
            // La llave sigue al portador
            const carrier = players[keyCarrierId];
            if (carrier) {
                Matter.Body.setPosition(keyBody, { 
                    x: carrier.body.position.x, 
                    y: carrier.body.position.y - 30 
                });
            }
        }
    }

    // Condición de Victoria
    const door = levelEntities.find(e => e.label === "door");
    const playersAtDoor = Object.values(players).filter(p => 
        Matter.Bounds.overlaps(p.body.bounds, door.bounds)
    ).length;

    if (playersAtDoor === Object.keys(players).length && keyCarrierId && Object.keys(players).length > 0) {
        currentLevel = currentLevel === 1 ? 2 : 1;
        loadLevel(currentLevel);
    }

    Matter.Engine.update(engine, 1000 / 60);
}, 1000 / 60);

// --- LOOP DE RED (30 FPS) ---
setInterval(() => {
    const state = {
        lvl: currentLevel,
        players: {},
        entities: levelEntities.map(e => ({
            type: e.label,
            x: e.position.x, y: e.position.y,
            w: e.w, h: e.h
        }))
    };
    Object.entries(players).forEach(([id, p]) => {
        state.players[id] = { x: p.body.position.x, y: p.body.position.y, color: p.color };
    });
    io.emit("state:update", state);
}, 33);

server.listen(3000, "0.0.0.0", () => console.log("Servidor LAN en puerto 3000"));