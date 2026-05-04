const { Engine, World } = Matter;

class Physics {
  constructor() {
    this.engine = Engine.create();
    this.world = this.engine.world;

    this.engine.gravity.y = 1;
  }

  update() {
    Engine.update(this.engine);
  }
}