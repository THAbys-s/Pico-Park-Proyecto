class PlayerManager {
  constructor(physics) {
    this.engine = physics.engine;
    this.players = {};
  }

  addPlayer(id, x, y) {
    const body = Matter.Bodies.rectangle(x, y, 40, 40, {
      friction: 0.1,
      restitution: 0
    });

    Matter.World.add(this.engine.world, body);

    this.players[id] = {
      id,
      body,
      input: { left: false, right: false, jump: false }
    };
  }

  update() {
    Object.values(this.players).forEach(player => {
      const { body, input } = player;

      if (input.left) {
        Matter.Body.setVelocity(body, { x: -5, y: body.velocity.y });
      }

      if (input.right) {
        Matter.Body.setVelocity(body, { x: 5, y: body.velocity.y });
      }

      if (input.jump) {
        Matter.Body.setVelocity(body, { x: body.velocity.x, y: -10 });
        player.input.jump = false;
      }
    });
  }

  render(ctx) {
    ctx.fillStyle = "blue";

    Object.values(this.players).forEach(player => {
      const { position } = player.body;

      ctx.fillRect(position.x - 20, position.y - 20, 40, 40);
    });
  }
}