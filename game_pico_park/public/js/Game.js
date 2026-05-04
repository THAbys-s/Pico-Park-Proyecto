class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.physics = new Physics();
    this.map = new MapSystem(this.physics);
    this.players = new PlayerManager(this.physics);

    // 🔥 conexión con red
    this.network = new NetworkManager(this.players);

    this.loop();
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    this.update();
    this.render();
  }

  update() {
    this.physics.update();
    this.players.update();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.map.render(this.ctx);
    this.players.render(this.ctx);
  }
}

new Game();