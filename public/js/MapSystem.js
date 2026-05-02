class MapSystem {
  constructor(physics) {
    this.engine = physics.engine;
    this.blocks = [];

    this.createLevel();
  }

  createLevel() {
    const ground = Matter.Bodies.rectangle(400, 380, 800, 40, {
      isStatic: true
    });

    const platform = Matter.Bodies.rectangle(400, 250, 200, 20, {
      isStatic: true
    });

    Matter.World.add(this.engine.world, [ground, platform]);

    this.blocks.push(ground, platform);
  }

  render(ctx) {
    ctx.fillStyle = "black";

    this.blocks.forEach(block => {
      const { vertices } = block;

      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);

      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
      }

      ctx.closePath();
      ctx.fill();
    });
  }
}