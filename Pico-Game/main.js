import Phaser from "phaser";

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    this.load.tilemapTiledJSON('mapa', 'assets/maps/nivel_1.json');
    this.load.image('tiles', 'assets/tilesets/tiles.png');
    this.load.image('player', 'assets/player.png');
  }

    create() {
        const map = this.make.tilemap({ key: 'mapa' });
        const tileset = map.addTilesetImage('Blocks', 'tiles');

        map.createLayer('Capa de patrones 1', tileset, 0, 0);

        const collisionLayer = map.getObjectLayer('colisiones');

        collisionLayer.objects.forEach(obj => {
            this.matter.add.rectangle(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            obj.width,
            obj.height,
            {
                isStatic: true
            }
            );
        });
        this.player = this.matter.add.sprite(100, 100, 'player');
        this.player.setBody({ type: 'rectangle', width: 20, height: 30 });
        this.player.setFixedRotation(); // reemplaza inertia: Infinity
        this.player.setFriction(0.1);
        this.player.setBounce(0);

        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.scale.resize(mapWidth, mapHeight);
        this.cameras.main.setZoom(1.5);
        this.cameras.main.startFollow(this.player);

        this.cursors = this.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            jump: 'W',
            space: 'SPACE'
        });

        const objetosLayer = map.getObjectLayer('objetos');
        const llaveObj = objetosLayer.objects.find(o => o.name === 'llave');

        // 2. Guardar posición original para el respawn
        this.llaveSpawnX = llaveObj.x;
        this.llaveSpawnY = llaveObj.y;

        // 3. Crear la llave como Matter Sprite (placeholder = círculo amarillo)
        const graphics = this.add.graphics();
        graphics.fillStyle(0xFFFF00);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture('llave_placeholder', 16, 16);
        graphics.destroy();

        this.llave = this.matter.add.sprite(this.llaveSpawnX, this.llaveSpawnY, 'llave_placeholder');
        this.llave.setCircle(8);         // hitbox circular
        this.llave.setIgnoreGravity(true); // flota
        this.llave.setStatic(false);
        this.llave.setSensor(true);      // no colisiona físicamente, solo detecta

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
        this.historyLength = 20; // cuántos frames atrás sigue (ajustable)
    }

    update() {
        const speed = 2.5;
        const jumpForce = -8;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }

        const isOnGround = Math.abs(this.player.body.velocity.y) < 0.01;

        if ((this.cursors.jump.isDown || this.cursors.space.isDown) && isOnGround) {
            this.player.setVelocityY(jumpForce);
        }
        if (this.llaveAgarrada) {
            this.llave.setPosition(
                this.player.x + 20, // 20px a la derecha del jugador
                this.player.y       // misma altura
            );
            this.llave.setVelocity(0, 0);
        }
        this.playerPosHistory.push({ x: this.player.x, y: this.player.y });
        if (this.playerPosHistory.length > this.historyLength) {
            this.playerPosHistory.shift();
        }

        // Mover la llave a la posición antigua
        if (this.llaveAgarrada && this.playerPosHistory.length === this.historyLength) {
                const oldPos = this.playerPosHistory[0];
                this.llave.setPosition(oldPos.x, oldPos.y);
                this.llave.setVelocity(0, 0);
            }
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
    width: mapWidth,
    height: mapHeight,
    backgroundColor: "#1d1d1d",
    scene: [MainScene],
    physics: {
      default: "matter",
      matter: {
        gravity: { y: 1 },
        debug: true // habilitar para ver las hitboxes durante el desarrollo
      }
    }
  };

  new Phaser.Game(config);
}

initGame();