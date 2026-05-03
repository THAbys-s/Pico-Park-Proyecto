class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        // 1. Inicializar sistemas de renderizado primero
        this.map = new MapSystem(); 
        this.players = new PlayerManager();

        // 2. Inicializar red pasando las referencias de los managers
        // Importante: El NetworkManager actualizará tanto a los jugadores como al mapa
        this.network = new NetworkManager(this.players, this.map);

        this._debug = true;
        this.loop();
    }

    loop() {
        // Usamos bind para no perder el contexto de 'this'
        requestAnimationFrame(this.loop.bind(this));

        this.update();
        this.render();
    }

    update() {
        // Aquí ocurre la interpolación (suavizado)
        this.players.update();
    }

    render() {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar el mapa (suelo y entidades como cajas/llaves)
        this.map.render(ctx);

        // Dibujar los jugadores interpolados
        this.players.render(ctx);

        if (this._debug) this._renderDebug(ctx);
    }

    _renderDebug(ctx) {
        const count = Object.keys(this.players.players).length;
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(10, 10, 140, 30);
        ctx.fillStyle = "#0f0";
        ctx.font = "14px monospace";
        ctx.fillText(`PLAYERS: ${count}`, 20, 30);
        ctx.restore();
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.game = new Game();
});