const ESTADOS = {
    IDLE: "idle",
    WALK: "walk",
    JUMP: "jump"
};

class MainScene extends window.Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        this.load.tilemapTiledJSON('mapa', 'assets/maps/nivel_1.json');

        this.load.image('tiles', 'assets/tilesets/tiles.png');

        this.load.image(
            'llave_sprite',
            'assets/tilesets/llave_sprite.png'
        );

        this.load.image(
            'player_idle',
            'assets/character/char_sprite_idle.png'
        );

        this.load.image(
            'player_jump',
            'assets/character/char_sprite_jump.png'
        );
    }

    create() {

        // SOCKET

        this.socket = window.io(window.location.origin, {
            query: {
                tipo: 'pantalla'
            }
        });

        this.jugadores = new Map();

        this.socket.on('connect', () => {
            console.log('[JUEGO] Conectado al servidor');
        });

        this.socket.on('disconnect', () => {
            console.log('[JUEGO] Desconectado del servidor');
        });

        // NUEVO JUGADOR

        this.socket.on('nuevoJugador', (data) => {

            const idJugador = data.idJugador;
            const color = parseInt(data.color, 16);

            console.log(`[JUEGO] Nuevo jugador ${idJugador}`);

            // evitar duplicados
            if (this.jugadores.has(idJugador)) {
                return;
            }

            this.crearJugador(
                idJugador,
                {
                    x: 100 + (idJugador * 80),
                    y: 100
                },
                color
            );
        });

        // INPUTS

        this.socket.on('inputDeJugador', (data) => {

            const idJugador = data.idJugador;

            const jugador = this.jugadores.get(idJugador);

            if (!jugador) return;

            const tipoEvento = data.tipoDeEvento;
            const tecla = data.teclaPresionada;

            if (tipoEvento === 'keydown') {
                jugador.inputs.add(tecla);
            }

            if (tipoEvento === 'keyup') {
                jugador.inputs.delete(tecla);
            }
        });

        // DESCONECTADO

        this.socket.on('jugadorDesconectado', (data) => {

            const idJugador = data.idJugador;

            console.log(`[JUEGO] Jugador desconectado ${idJugador}`);

            const jugador = this.jugadores.get(idJugador);

            if (!jugador) return;

            jugador.inputs.clear();
        });

        // LIBERADO

        this.socket.on('jugadorLiberado', (data) => {

            const idJugador = data.idJugador;

            console.log(`[JUEGO] Jugador liberado ${idJugador}`);

            const jugador = this.jugadores.get(idJugador);

            if (!jugador) return;

            if (jugador.sprite) {
                jugador.sprite.destroy();
            }

            this.jugadores.delete(idJugador);
        });

        // MAPA

        const map = this.make.tilemap({
            key: 'mapa'
        });

        const tileset = map.addTilesetImage(
            'Blocks',
            'tiles'
        );

        map.createLayer(
            'Capa de patrones 1',
            tileset,
            0,
            0
        );

        const collisionLayer = map.getObjectLayer('colisiones');

        const wallLayer = map.getObjectLayer('colisiones_pared');

        // SUELO

        collisionLayer.objects.forEach(obj => {

            this.matter.add.rectangle(
                obj.x + obj.width / 2,
                obj.y + obj.height / 2,
                obj.width,
                obj.height,
                {
                    isStatic: true,
                    label: 'ground'
                }
            );
        });

        // PAREDES

        wallLayer.objects.forEach(obj => {

            this.matter.add.rectangle(
                obj.x + obj.width / 2,
                obj.y + obj.height / 2,
                obj.width,
                obj.height,
                {
                    isStatic: true,
                    label: 'wall'
                }
            );
        });

        // CÁMARA

        const zoom = 1.5;

        this.cameras.main.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels
        );

        this.cameras.main.setZoom(zoom);

        this.cameras.main.setBackgroundColor("#000000");

        // COLISIONES
        this.matter.world.on('collisionstart', (event) => {

            event.pairs.forEach(pair => {

                const { bodyA, bodyB } = pair;

                // Detección de colisión con el suelo.

                for (const [id, jugador] of this.jugadores) {

                    if (!jugador.sprite) continue;

                    if (
                        (
                            bodyA === jugador.sprite.body &&
                            bodyB.label === 'ground'
                        )
                        ||
                        (
                            bodyB === jugador.sprite.body &&
                            bodyA.label === 'ground'
                        )
                    ){
                        jugador.enSuelo = true;
                    }

                    // Detección de colisión con la caja (para saltar encima)

                    if (
                        (
                            bodyA === jugador.sprite.body &&
                            bodyB.label === 'caja'
                        )
                        ||
                        (
                            bodyB === jugador.sprite.body &&
                            bodyA.label === 'caja'
                        )
                    ){
                        // Si el jugador está cayendo o quieto verticalmente, considerar en suelo
                        if (jugador.sprite.body.velocity.y >= -0.1) {
                            jugador.enSuelo = true;
                        }
                    }
                }

                for (const [id1, jugador1] of this.jugadores) {

                    if (
                        jugador1.sprite &&
                        jugador1.sprite.body === bodyA
                    ) {

                        for (const [id2, jugador2] of this.jugadores) {

                            if (
                                id1 !== id2 &&
                                jugador2.sprite &&
                                jugador2.sprite.body === bodyB
                            ) {
                                this.manejarColisionJugadores(
                                    jugador1,
                                    jugador2
                                );
                            }
                        }
                    }
                }

                // Lógica de colisión con la llave.

                if (this.llave) {

                    const llaveBody = this.llave.body;

                    for (const [id, jugador] of this.jugadores) {

                        if (
                            jugador.sprite &&
                            (
                                (
                                    bodyA === jugador.sprite.body &&
                                    bodyB === llaveBody
                                )
                                ||
                                (
                                    bodyA === llaveBody &&
                                    bodyB === jugador.sprite.body
                                )
                            )
                        ) {
                            this.agarrarLlave(jugador);
                        }
                    }
                }

                // Lógica de colisión con la puerta.

                if (this.puerta) {

                    for (const [id, jugador] of this.jugadores) {

                        if (
                            jugador.sprite &&
                            (
                                (
                                    bodyA === jugador.sprite.body &&
                                    bodyB.label === 'puerta'
                                )
                                ||
                                (
                                    bodyA.label === 'puerta' &&
                                    bodyB === jugador.sprite.body
                                )
                            )
                        ) {
                            jugador.enPuerta = true;

                            if (jugador.hasKey && !this.puertaAbierta) {
                                this.abrirPuerta();
                            }
                        }
                    }
                }

                // Lógica de colisión con resortes.

                if (this.resortes && this.resortes.length) {
                    for (const resorte of this.resortes) {
                        for (const [id, jugador] of this.jugadores) {
                            if (
                                jugador.sprite &&
                                (
                                    (
                                        bodyA === jugador.sprite.body &&
                                        bodyB === resorte.body
                                    )
                                    ||
                                    (
                                        bodyB === jugador.sprite.body &&
                                        bodyA === resorte.body
                                    )
                                )
                            ) {
                                const velocityY = jugador.sprite.body.velocity.y;

                                if (velocityY >= 0) {

                                    // impulso fuerte del resorte
                                    jugador.sprite.setVelocityY(-20);

                                    // marcar que ya no está en suelo
                                    jugador.enSuelo = false;
                                }
                            }
                        }
                    }
                }
            });
        });

        this.matter.world.on('collisionend', (event) => {
            event.pairs.forEach(pair => {

                const { bodyA, bodyB } = pair;

                for (const [id, jugador] of this.jugadores) {

                    if (!jugador.sprite) continue;

                    if (
                        (
                            bodyA === jugador.sprite.body &&
                            bodyB.label === 'ground'
                        )
                        ||
                        (
                            bodyB === jugador.sprite.body &&
                            bodyA.label === 'ground'
                        )
                    ) {
                        jugador.enSuelo = false;
                    }

                    if (
                        jugador.sprite &&
                        (
                            (
                                bodyA === jugador.sprite.body &&
                                bodyB.label === 'puerta'
                            )
                            ||
                            (
                                bodyA.label === 'puerta' &&
                                bodyB === jugador.sprite.body
                            )
                        )
                    ) {
                        jugador.enPuerta = false;
                    }
                }
            });
        });

        // Renderizado de llave en el mapa.

        const objetosLayer = map.getObjectLayer('objetos');

        const llaveObj = objetosLayer?.objects.find(
            o => o.name === 'llave'
        );

        if (llaveObj) {

            this.llaveSpawnX = llaveObj.x;
            this.llaveSpawnY = llaveObj.y;

            this.llave = this.matter.add.sprite(
                this.llaveSpawnX,
                this.llaveSpawnY,
                'llave_sprite'
            );

            this.llave.setCircle(8);

            this.llave.setIgnoreGravity(true);

            this.llave.setStatic(false);

            this.llave.setSensor(true);

            this.llave.body.label = 'llave';

            this.llaveAgarrada = false;

            this.llaveAgarraPor = null;
        }

        const puertaObj = objetosLayer?.objects.find(
            o => o.name === 'puerta'
        );

        if (puertaObj) {
            this.puerta = this.matter.add.rectangle(
                puertaObj.x + puertaObj.width / 2,
                puertaObj.y + puertaObj.height / 2,
                puertaObj.width,
                puertaObj.height,
                {
                    isStatic: true,
                    isSensor: true,
                    label: 'puerta'
                }
            );

            this.add.rectangle(
                puertaObj.x + puertaObj.width / 2,
                puertaObj.y + puertaObj.height / 2,
                puertaObj.width,
                puertaObj.height,
                0x663300,
                1
            );

            this.puertaAbierta = false;
        }

        const escaleraObj = objetosLayer?.objects.find(
            o => o.name === 'escalera'
        );

        if (escaleraObj) {
            this.escalera = this.matter.add.rectangle(
                escaleraObj.x + escaleraObj.width / 2,
                escaleraObj.y + escaleraObj.height / 2,
                escaleraObj.width,
                escaleraObj.height,
                {
                    isStatic: true,
                    isSensor: true,
                    label: 'escalera'
                }
            );

            this.add.rectangle(
                escaleraObj.x + escaleraObj.width / 2,
                escaleraObj.y + escaleraObj.height / 2,
                escaleraObj.width,
                escaleraObj.height,
                0x888888,
                0.3
            );
        }

        const resorteObjs = objetosLayer?.objects.filter(
            o => o.name === 'resorte'
        ) || [];

        this.resortes = [];

        resorteObjs.forEach(resorteObj => {
            const resorte = this.matter.add.rectangle(
                resorteObj.x + resorteObj.width / 2,
                resorteObj.y + resorteObj.height / 2,
                resorteObj.width,
                resorteObj.height,
                {
                    isStatic: true,
                    isSensor: true,
                    label: 'resorte'
                }
            );

            this.add.rectangle(
                resorteObj.x + resorteObj.width / 2,
                resorteObj.y + resorteObj.height / 2,
                resorteObj.width,
                resorteObj.height,
                0xffaa00,
                0.6
            );

            this.resortes.push(resorte);
        });

        const cajaObj = objetosLayer?.objects.find(
            o => o.name === 'caja'
        );

        if (cajaObj) {
            const hitboxWidth = cajaObj.width;
            const hitboxHeight = cajaObj.height;
            const spriteWidth = cajaObj.width;
            const spriteHeight = cajaObj.height;

            this.caja = this.matter.add.rectangle(
                cajaObj.x + cajaObj.width / 2,
                cajaObj.y + cajaObj.height / 2,
                hitboxWidth,
                hitboxHeight,
                {
                    isStatic: false,
                    label: 'caja',
                    friction: 1.0,
                    frictionAir: 0.2,
                    restitution: 0,
                    density: 0.005
                }
            );

            this.cajaGraphics = this.add.rectangle(
                cajaObj.x + cajaObj.width / 2,
                cajaObj.y + cajaObj.height / 2,
                spriteWidth,
                spriteHeight,
                0x8B4513, // Marrón
                1
            );
        }

        // Teclado Local para debug (Luego se eliminará)

        this.cursors = this.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            jump: 'W',
            space: 'SPACE'
        });
    }

    // Lógica de Creación del jugador.

    crearJugador(idJugador, posicion, color) {

        const sprite = this.matter.add.sprite(
            posicion.x,
            posicion.y,
            'player_idle'
        );

        sprite.setTint(color);

        // tamaño visual más chico
        sprite.setScale(0.65);

        // hitbox más precisa
        sprite.setBody({
            type: 'rectangle',
            width: 18,
            height: 22
        });

        sprite.setFixedRotation();

        sprite.setFriction(0.1);

        sprite.setBounce(0);

        sprite.body.label = `player_${idJugador}`;

        const jugador = {

            idJugador,

            sprite,

            estado: ESTADOS.IDLE,

            inputs: new Set(),

            posHistory: [],

            historyLen: 20,

            enSuelo: false,

            hasKey: false,

            enPuerta: false,

            salio: false
        };

        this.jugadores.set(idJugador, jugador);

        return jugador;
    }

    // Lógica de Estados y Animaciones

    actualizarEstadoJugador(jugadorObj) {

        if (!jugadorObj || !jugadorObj.sprite) {
            return;
        }

        const velocityX =
            jugadorObj.sprite.body.velocity.x;

        const velocityY =
            jugadorObj.sprite.body.velocity.y;

        const enSuelo =
            Math.abs(velocityY) < 0.5;

        let nuevoEstado = ESTADOS.IDLE;

        if (!enSuelo) {

            nuevoEstado = ESTADOS.JUMP;

        } else if (Math.abs(velocityX) > 0.5) {

            nuevoEstado = ESTADOS.WALK;
        }

        if (nuevoEstado !== jugadorObj.estado) {

            jugadorObj.estado = nuevoEstado;

            switch (nuevoEstado) {

                case ESTADOS.IDLE:
                case ESTADOS.WALK:

                    jugadorObj.sprite.setTexture('player_idle');

                    break;

                case ESTADOS.JUMP:

                    jugadorObj.sprite.setTexture(
                        'player_jump'
                    );

                    break;
            }
        }
    }

    // Colisiones entre jugadores.

    manejarColisionJugadores(jugador1, jugador2) {

        const dx =
            jugador2.sprite.x - jugador1.sprite.x;

        const dy =
            jugador2.sprite.y - jugador1.sprite.y;

        const distancia =
            Math.sqrt(dx * dx + dy * dy);

    if (distancia < 20 && distancia > 0) {

        const minDist = 20;

            const ratio = minDist / distancia;

            const separationX =
                dx * (ratio - 1) * 0.5;

            const separationY =
                dy * (ratio - 1) * 0.5;

            jugador1.sprite.x -= separationX;
            jugador1.sprite.y -= separationY;

            jugador2.sprite.x += separationX;
            jugador2.sprite.y += separationY;
        }
    }

    // Lógica de la llave.

    agarrarLlave(jugador) {

        if (this.llaveAgarrada) {
            return;
        }

        this.llaveAgarrada = true;

        this.llaveAgarraPor = jugador.idJugador;

        jugador.hasKey = true;

        this.llave.setIgnoreGravity(true);

        this.llave.setSensor(true);
    }

    abrirPuerta() {
        this.puertaAbierta = true;

        if (this.puerta) {
            const puertaGraphics = this.add.rectangle(
                this.puerta.position.x,
                this.puerta.position.y,
                this.puerta.bounds.max.x - this.puerta.bounds.min.x,
                this.puerta.bounds.max.y - this.puerta.bounds.min.y,
                0x00aa00,
                0.8
            );
            puertaGraphics.setDepth(1);
        }

        console.log('[JUEGO] Puerta abierta');
    }

    salirDelNivel(jugador) {
        if (!jugador || jugador.salio) {
            return;
        }

        jugador.salio = true;
        jugador.sprite.setVelocity(0, 0);
        jugador.sprite.setTint(0x00ff00);
        jugador.sprite.setStatic(true);

        console.log(
            `[JUEGO] Jugador ${jugador.idJugador} salió del nivel`
        );
    }

    // UPDATE

    update() {

        const speed = 2.5;

        const jumpForce = -6;

        // Input Locales para debug.

        // debug local
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

                if (
                    !jugador.inputs.has('ArrowLeft') &&
                    !jugador.inputs.has('ArrowRight')
                ) {
                    jugador.sprite.setVelocityX(0);
                }
            }
        }

        // Controlador de inputs del gamepad

        for (const [id, jugador] of this.jugadores) {

            if (jugador.salio) {
                continue;
            }

            const inputs = jugador.inputs;

            // Detección de movimiento horizontal.

            if (inputs.has('ArrowLeft')) {

                jugador.sprite.setVelocityX(-speed);

                jugador.sprite.setFlipX(true);

            } else if (inputs.has('ArrowRight')) {

                jugador.sprite.setVelocityX(speed);

                jugador.sprite.setFlipX(false);

            } else {

                jugador.sprite.setVelocityX(0);
            }

            // Lógica de salida de nivel cuando el jugador tiene la llave y está en la puerta.

            if (
                jugador.hasKey &&
                jugador.enPuerta &&
                inputs.has('ArrowUp')
            ) {
                this.salirDelNivel(jugador);
                continue;
            }

            // Detección de salto.

            const isOnGround = jugador.enSuelo;

            if (
                (
                    inputs.has('Space') ||
                    inputs.has('ArrowUp')
                )
                &&
                isOnGround
            ) {
                jugador.sprite.setVelocityY(
                    jumpForce
                );
                jugador.enSuelo = false; // Prevenir saltos infinitos
            }

            // Actualizar animación segun el estado.

            this.actualizarEstadoJugador(jugador);
        }

        // Actualizar posición de la llave si está agarrada

        if (
            this.llave &&
            this.llaveAgarrada
        ) {

            const jugador =
                this.jugadores.get(
                    this.llaveAgarraPor
                );

            if (jugador) {

                jugador.posHistory.push({
                    x: jugador.sprite.x,
                    y: jugador.sprite.y
                });

                if (
                    jugador.posHistory.length >
                    jugador.historyLen
                ) {
                    jugador.posHistory.shift();
                }

                if (
                    jugador.posHistory.length ===
                    jugador.historyLen
                ) {

                    const oldPos =
                        jugador.posHistory[0];

                    this.llave.setPosition(
                        oldPos.x,
                        oldPos.y
                    );

                    this.llave.setVelocity(0, 0);
                }
            }
        }

        // Cámara sigue al primer jugador conectado

        let primerJugador = null;

        for (const [id, jugador] of this.jugadores) {

            if (jugador.sprite) {

                primerJugador = jugador;

                break;
            }
        }

        if (primerJugador) {

            this.cameras.main.startFollow(
                primerJugador.sprite,
                true,
                0.1,
                0.1
            );
        }

        // Sincronizar posición del gráfico de la caja con el body físico

        if (this.caja && this.cajaGraphics) {
            this.cajaGraphics.setPosition(this.caja.position.x, this.caja.position.y);
        }
    }
}

// Init de Phase y la pantalla del juego.

async function initGame() {

    const config = {

        type: window.Phaser.AUTO,

        width: 800,

        height: 600,

        parent: "juego",

        backgroundColor: "#000000",

        physics: {

            default: "matter",

            matter: {

                gravity: {
                    y: 1
                },

                debug: true
            }
        },

        scene: [MainScene]
    };

    new window.Phaser.Game(config);
}

initGame();