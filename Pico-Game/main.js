const ESTADOS = {
    IDLE: "idle",
    WALK: "walk",
    JUMP: "jump"
};

class MainScene extends window.Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    actualizarEstadoJugador(jugadorObj) {
        if (!jugadorObj || !jugadorObj.sprite) return;

        const velocityX = jugadorObj.sprite.body.velocity.x;
        const velocityY = jugadorObj.sprite.body.velocity.y;
        const enSuelo = Math.abs(velocityY) < 0.5;

        let nuevoEstado = ESTADOS.IDLE;

        if (!enSuelo) {
            nuevoEstado = ESTADOS.JUMP;
        } else if (Math.abs(velocityX) > 0.5) {
            nuevoEstado = ESTADOS.WALK;
        } else {
            nuevoEstado = ESTADOS.IDLE;
        }

        if (nuevoEstado !== jugadorObj.estado) {
            jugadorObj.estado = nuevoEstado;

            switch (nuevoEstado) {
                case ESTADOS.IDLE:
                case ESTADOS.WALK:
                    jugadorObj.sprite.setTexture('player_idle');
                    break;
                case ESTADOS.JUMP:
                    jugadorObj.sprite.setTexture('player_jump');
                    break;
            }
        }
    }

    preload() {
        this.load.tilemapTiledJSON('mapa', 'assets/maps/nivel_1.json');
        this.load.image('tiles', 'assets/tilesets/tiles.png');
        this.load.image('player_idle', 'assets/character/char_sprite_idle.png');
        this.load.image('player_jump', 'assets/character/char_sprite_jump.png');
    }

    create() {
        // ====== INICIALIZAR SOCKET.IO ======
        this.socket = window.io(window.location.origin, {
            query: { tipo: 'pantalla' }
        });

        this.socketToGamepadId = new Map(); // Mapeo: socketId -> gamepadId

        this.socket.on('connect', () => {
            console.log('[JUEGO] Conectado al servidor');
        });

        this.socket.on('servidorReiniciado', () => {
            console.log('[JUEGO] Servidor reiniciado, limpiando jugadores');
            // Limpiar todos los jugadores
            for (const [id, jugador] of this.jugadores) {
                if (jugador.sprite) {
                    jugador.sprite.destroy();
                }
            }
            this.jugadores.clear();
            this.socketToGamepadId.clear();
        });

        this.socket.on('nuevoJugador', (data) => {
            const socketId = data.idDelSocket;
            const color = parseInt(data.color, 16); // Convertir hex string a número
            const gamepadId = this.socketToGamepadId.size; // ID del gamepad (0-3)
            
            console.log(`[JUEGO] Nuevo jugador - Socket: ${socketId}, Color: ${color}, ID: ${gamepadId}`);
            
            if (!this.jugadores.has(socketId)) {
                this.socketToGamepadId.set(socketId, gamepadId);
                this.crearJugador(socketId, { x: 100 + (gamepadId * 80), y: 100 }, color);
            }
        });

        this.socket.on('inputDeJugador', (data) => {
            const socketId = data.idDelSocket;
            const jugador = this.jugadores.get(socketId);
            
            if (jugador && jugador.socket) {
                const tipoEvento = data.tipoDeEvento;
                const tecla = data.teclaPresionada;
                
                if (tipoEvento === 'keydown') {
                    jugador.socket.inputs.add(tecla);
                } else if (tipoEvento === 'keyup') {
                    jugador.socket.inputs.delete(tecla);
                }
            }
        });

        this.socket.on('jugadorDesconectado', (socketId) => {
            console.log(`[JUEGO] Jugador desconectado: ${socketId}`);
            const jugador = this.jugadores.get(socketId);
            if (jugador && jugador.sprite) {
                jugador.sprite.destroy();
                this.jugadores.delete(socketId);
                this.socketToGamepadId.delete(socketId);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('[JUEGO] Desconectado del servidor');
        });

        // ====== CARGAR MAPA Y COLLISIONS ======
        const map = this.make.tilemap({ key: 'mapa' });
        const tileset = map.addTilesetImage('Blocks', 'tiles');
        const zoom = 2;
        const collisionLayer = map.getObjectLayer('colisiones');

        map.createLayer('Capa de patrones 1', tileset, 0, 0);

        collisionLayer.objects.forEach(obj => {
            this.matter.add.rectangle(
                obj.x + obj.width / 2,
                obj.y + obj.height / 2,
                obj.width,
                obj.height,
                { isStatic: true, label: 'tile' }
            );
        });

        // ====== CONFIGURAR CÁMARA ======
        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.setZoom(zoom);
        this.cameras.main.setBackgroundColor("#000000");

        // ====== INICIALIZAR JUGADORES ======
        this.jugadores = new Map();
        this.localPlayerId = null;
        this.localPlayer = null;

        // Registrar eventos de colisión
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                
                // Colisión entre jugadores
                for (const [id, jugador] of this.jugadores) {
                    if (jugador.sprite && jugador.sprite.body === bodyA) {
                        for (const [id2, jugador2] of this.jugadores) {
                            if (id !== id2 && jugador2.sprite && jugador2.sprite.body === bodyB) {
                                this.manejarColisionJugadores(jugador, jugador2);
                            }
                        }
                    }
                }

                // Colisión con llave
                if (this.llave) {
                    const llaveBody = this.llave.body;
                    for (const [id, jugador] of this.jugadores) {
                        if (jugador.sprite && 
                            ((bodyA === jugador.sprite.body && bodyB === llaveBody) ||
                             (bodyA === llaveBody && bodyB === jugador.sprite.body))) {
                            this.agarrarLlave(jugador);
                        }
                    }
                }
            });
        });

        // ====== CREAR LLAVE ======
        const objetosLayer = map.getObjectLayer('objetos');
        const llaveObj = objetosLayer?.objects.find(o => o.name === 'llave');

        if (llaveObj) {
            this.llaveSpawnX = llaveObj.x;
            this.llaveSpawnY = llaveObj.y;

            const graphics = this.add.graphics();
            graphics.fillStyle(0xFFFF00);
            graphics.fillCircle(8, 8, 8);
            graphics.generateTexture('llave_placeholder', 16, 16);
            graphics.destroy();

            this.llave = this.matter.add.sprite(this.llaveSpawnX, this.llaveSpawnY, 'llave_placeholder');
            this.llave.setCircle(8);
            this.llave.setIgnoreGravity(true);
            this.llave.setStatic(false);
            this.llave.setSensor(true);
            this.llave.body.label = 'llave';
            this.llaveAgarrada = false;
            this.llaveAgarraPor = null;
            this.playerPosHistory = [];
            this.historyLength = 20;
        }

        // Controles locales (teclado)
        this.cursors = this.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            jump: 'W',
            space: 'SPACE'
        });
    }

    crearJugador(socketId, posicion, color) {
        // Crear sprite coloreado
        const graphics = this.add.graphics();
        graphics.fillStyle(color);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture(`player_${socketId}_idle`, 32, 32);
        graphics.destroy();

        const jugador = {
            socketId: socketId,
            sprite: this.matter.add.sprite(posicion.x, posicion.y, `player_${socketId}_idle`),
            estado: ESTADOS.IDLE,
            inputs: new Set(),
            socket: { inputs: new Set() },
            posHistory: [],
            historyLen: 20,
            llaveAgarrada: false
        };

        jugador.sprite.setBody({
            type: 'rectangle',
            width: 32,
            height: 32
        });
        jugador.sprite.setFixedRotation();
        jugador.sprite.setFriction(0.1);
        jugador.sprite.setBounce(0);
        jugador.sprite.body.label = `player_${socketId}`;
        
        this.jugadores.set(socketId, jugador);

        return jugador;
    }

    manejarColisionJugadores(jugador1, jugador2) {
        // Separar jugadores levemente para evitar que se atraviesen
        const dx = jugador2.sprite.x - jugador1.sprite.x;
        const dy = jugador2.sprite.y - jugador1.sprite.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        if (distancia < 32) {
            const minDist = 32;
            const ratio = minDist / distancia;
            
            const separationX = dx * (ratio - 1) * 0.5;
            const separationY = dy * (ratio - 1) * 0.5;

            jugador1.sprite.x -= separationX;
            jugador1.sprite.y -= separationY;
            jugador2.sprite.x += separationX;
            jugador2.sprite.y += separationY;
        }
    }

    agarrarLlave(jugador) {
        if (this.llaveAgarrada) return;
        this.llaveAgarrada = true;
        this.llaveAgarraPor = jugador.socketId;
        this.llave.setIgnoreGravity(true);
        this.llave.setSensor(true);
    }

    update() {
        const speed = 2.5;
        const jumpForce = -6;

        // ====== PROCESAR INPUTS LOCALES (TECLADO) ======
        if (this.cursors.left.isDown) {
            for (const [id, jugador] of this.jugadores) {
                jugador.sprite.setVelocityX(-speed);
                jugador.sprite.setFlipX(true);
            }
        } else if (this.cursors.right.isDown) {
            for (const [id, jugador] of this.jugadores) {
                jugador.sprite.setVelocityX(speed);
                jugador.sprite.setFlipX(false);
            }
        } else {
            for (const [id, jugador] of this.jugadores) {
                jugador.sprite.setVelocityX(0);
            }
        }

        // ====== PROCESAR INPUTS DEL SOCKET (GAMEPAD) ======
        for (const [id, jugador] of this.jugadores) {
            const inputs = jugador.socket.inputs;

            if (inputs.has('ArrowLeft')) {
                jugador.sprite.setVelocityX(-speed);
                jugador.sprite.setFlipX(true);
            } else if (inputs.has('ArrowRight')) {
                jugador.sprite.setVelocityX(speed);
                jugador.sprite.setFlipX(false);
            }

            const isOnGround = Math.abs(jugador.sprite.body.velocity.y) < 0.5;

            if ((inputs.has('Space') || inputs.has('ArrowUp')) && isOnGround) {
                jugador.sprite.setVelocityY(jumpForce);
            }
        }

        // ====== ACTUALIZAR LLAVE ======
        if (this.llave && this.llaveAgarrada) {
            const jugador = this.jugadores.get(this.llaveAgarraPor);
            if (jugador) {
                jugador.posHistory.push({ x: jugador.sprite.x, y: jugador.sprite.y });
                if (jugador.posHistory.length > jugador.historyLen) {
                    jugador.posHistory.shift();
                }

                if (jugador.posHistory.length === jugador.historyLen) {
                    const oldPos = jugador.posHistory[0];
                    this.llave.setPosition(oldPos.x, oldPos.y);
                    this.llave.setVelocity(0, 0);
                }
            }
        }

        // ====== ACTUALIZAR ESTADOS Y CÁMARA ======
        let primerJugador = null;
        for (const [id, jugador] of this.jugadores) {
            this.actualizarEstadoJugador(jugador);
            if (primerJugador === null) primerJugador = jugador;
        }

        if (primerJugador) {
            this.cameras.main.startFollow(primerJugador.sprite, true, 0.1, 0.1);
        }
    }
}

async function initGame() {
    const mapData = await fetch('assets/maps/nivel_1.json').then(resp => resp.json());
    const mapWidth = mapData.width * mapData.tilewidth;
    const mapHeight = mapData.height * mapData.tileheight;

    const config = {
        type: window.Phaser.AUTO,
        width: 800,
        height: 600,
        parent: "juego",
        backgroundColor: "#000000",
        physics: {
            default: "matter",
            matter: {
                gravity: { y: 1 },
                debug: true
            }
        },
        scene: [MainScene]
    };

    new window.Phaser.Game(config);
}

initGame();