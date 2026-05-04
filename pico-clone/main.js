import Phaser from "phaser";

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    // después cargamos Tiled acá
  }

  create() {
    console.log("Phaser funcionando");
  }

  update() {}
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
      debug: true // habilitar para ver los cuerpos físicos durante el desarrollo
    }
  }
};

new Phaser.Game(config);