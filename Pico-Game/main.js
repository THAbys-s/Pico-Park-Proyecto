import Phaser from "phaser";

const ESTADOS = {
    IDLE: "idle",
    WALK: "walk",
    JUMP: "jump"
};

class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    actualizarEstado() {
        const velocityX = this.player.body.velocity.x;
        const velocityY = this.player.body.velocity.y;
        const enSuelo = Math.abs(velocityY) < 0.5;

        let nuevoEstado = ESTADOS.IDLE;

        if (!enSuelo) {
            nuevoEstado = ESTADOS.JUMP;
        } else if (Math.abs(velocityX) > 0.5) {
            nuevoEstado = ESTADOS.WALK;
        } else {
            nuevoEstado = ESTADOS.IDLE;
        }

        if (nuevoEstado !== this.estadoPlayer) {
            this.estadoPlayer = nuevoEstado;

            switch (nuevoEstado) {
                case ESTADOS.IDLE:
                case ESTADOS.WALK:   // ✅ no hay sprite de walk, usa idle
                    this.player.setTexture('player_idle');
                    break;
                case ESTADOS.JUMP:
                    this.player.setTexture('player_jump');
                    break;
            }
        }
    }

    preload() {
        this.load.tilemapTiledJSON('mapa', 'assets/maps/nivel_1.json');
        this.load.image('tiles', 'assets/tilesets/tiles.png');
        this.load.image('player_idle', 'assets/character/char_sprite_idle.png'); // ✅ image, no spritesheet
        this.load.image('player_jump', 'assets/character/char_sprite_jump.png'); // ✅ image, no spritesheet
    }

    create() {
        const map = this.make.tilemap({ key: 'mapa' });
        const tileset = map.addTilesetImage('Blocks', 'tiles');
        const zoom = 2; // ajusta esto
        const collisionLayer = map.getObjectLayer('colisiones');


        this.estadoPlayer = ESTADOS.IDLE;

        map.createLayer('Capa de patrones 1', tileset, 0, 0);

        collisionLayer.objects.forEach(obj => {
            this.matter.add.rectangle(
                obj.x + obj.width / 2,
                obj.y + obj.height / 2,
                obj.width,
                obj.height,
                { isStatic: true }
            );
        });

        this.player = this.matter.add.sprite(100, 100, 'player_idle');
        this.player.setBody({
            type: 'rectangle',
            width: this.player.width,
            height: this.player.height
        });
        this.player.setFixedRotation();
        this.player.setFriction(0.1);
        this.player.setBounce(0);

        // ✅ Escalar el sprite para que no sea enorme en el mapa
        this.player.setDisplaySize(32, 32);

        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.setZoom(zoom);
        this.cameras.main.setBackgroundColor("#000000");
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cursors = this.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            jump: 'W',
            space: 'SPACE'
        });

        const objetosLayer = map.getObjectLayer('objetos');
        const llaveObj = objetosLayer.objects.find(o => o.name === 'llave');

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

        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                const playerBody = this.player.body;
                const llaveBody = this.llave.body;

                if ((bodyA === playerBody && bodyB === llaveBody) ||
                    (bodyA === llaveBody && bodyB === playerBody)) {
                    this.agarrarLlave();
                }
            });
        });

        this.llaveAgarrada = false;
        this.llaveConstraint = null;
        this.playerPosHistory = [];
        this.historyLength = 20;
    }

    update() {
        const speed = 2.5;
        const jumpForce = -6;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        const isOnGround = Math.abs(this.player.body.velocity.y) < 0.5;

        if ((this.cursors.jump.isDown || this.cursors.space.isDown) && isOnGround) {
            this.player.setVelocityY(jumpForce);
        }

        this.playerPosHistory.push({ x: this.player.x, y: this.player.y });
        if (this.playerPosHistory.length > this.historyLength) {
            this.playerPosHistory.shift();
        }

        if (this.llaveAgarrada && this.playerPosHistory.length === this.historyLength) {
            const oldPos = this.playerPosHistory[0];
            this.llave.setPosition(oldPos.x, oldPos.y);
            this.llave.setVelocity(0, 0);
        }

        this.actualizarEstado();
    }

    agarrarLlave() {
        if (this.llaveAgarrada) return;
        this.llaveAgarrada = true;
        this.llave.setIgnoreGravity(true);
        this.llave.setSensor(true);
    }
}

async function initGame() {
    const mapData = await fetch('assets/maps/nivel_1.json').then(resp => resp.json());
    const mapWidth = mapData.width * mapData.tilewidth;
    const mapHeight = mapData.height * mapData.tileheight;

    const config = {
    type: Phaser.AUTO,
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

    new Phaser.Game(config);
}

initGame();