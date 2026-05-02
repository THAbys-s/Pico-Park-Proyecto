class LevelSystem {
  constructor(physics) {
    this.physics = physics;

    this.key = null;
    this.door = null;

    this.playersInGoal = new Set();
    this.keyCollected = false;
  }

  create() {
    // Llave
    this.key = Matter.Bodies.circle(200, 200, 15, {
      isSensor: true,
      label: "key"
    });

    // Puerta
    this.door = Matter.Bodies.rectangle(700, 340, 40, 80, {
      isStatic: true,
      label: "door"
    });

    this.physics.add(this.key);
    this.physics.add(this.door);
  }

  setupCollisions(playerManager) {
    Matter.Events.on(this.physics.engine, "collisionStart", (event) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;

        // PLAYER toca KEY
        if (this.isPlayer(bodyA, playerManager) && bodyB === this.key ||
            this.isPlayer(bodyB, playerManager) && bodyA === this.key) {

          this.keyCollected = true;
          this.physics.remove(this.key);
          console.log("🔑 Llave recogida");
        }
      });
    });
  }

  isPlayer(body, playerManager) {
    return Object.values(playerManager.players)
      .some(p => p.body === body);
  }

  update(playerManager) {
    this.playersInGoal.clear();

    Object.values(playerManager.players).forEach(p => {
      const dx = p.body.position.x - this.door.position.x;
      const dy = p.body.position.y - this.door.position.y;

      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 60) {
        this.playersInGoal.add(p.id);
      }
    });
  }

  isCompleted(playerManager) {
    return (
      this.keyCollected &&
      this.playersInGoal.size === Object.keys(playerManager.players).length &&
      this.playersInGoal.size >= 1 // evita bug si no hay players
    );
  }

  render(ctx) {
    // Llave
    if (!this.keyCollected) {
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(this.key.position.x, this.key.position.y, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Puerta
    ctx.fillStyle = this.keyCollected ? "green" : "red";
    ctx.fillRect(
      this.door.position.x - 20,
      this.door.position.y - 40,
      40,
      80
    );
  }
}