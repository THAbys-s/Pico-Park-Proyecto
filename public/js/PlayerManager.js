class PlayerManager {
    constructor() {
        this.players = {};      // Posiciones visuales
        this.serverState = {};  // Datos crudos del server
        this.sprites = new SpriteSystem();
    }

    setState(data) {
        this.serverState = data;
        // Si entra alguien nuevo, lo creamos de inmediato
        for (const id in data) {
            if (!this.players[id]) {
                this.players[id] = { ...data[id] };
            }
        }
        // Borrar desconectados
        for (const id in this.players) {
            if (!data[id]) delete this.players[id];
        }
    }

    update() {
        for (const id in this.players) {
            if (this.serverState[id]) {
                // Suavizado (Lerp)
                this.players[id].x += (this.serverState[id].x - this.players[id].x) * 0.3;
                this.players[id].y += (this.serverState[id].y - this.players[id].y) * 0.3;
            }
        }
    }

    render(ctx) {
        for (const id in this.players) {
            this.sprites.renderPlayer(ctx, this.players[id]);
        }
    }
}