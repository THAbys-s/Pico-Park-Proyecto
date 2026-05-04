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
        this.cameras.main.startFollow(this.player); // funciona directo


        this.cameras.main.startFollow(this.player);
        this.cursors = this.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            jump: 'W',
            space: 'SPACE'
            });
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
    }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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