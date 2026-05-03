class NetworkManager {
    constructor(playerManager, mapSystem) {
        this.socket = io({ transports: ["websocket"] });
        this.inputs = { left: false, right: false, jump: false };

        this.socket.on("state:update", (state) => {
            playerManager.setState(state.players);
            mapSystem.setEntities(state.entities);
        });

        // Captura de teclado local (para pruebas)
        window.addEventListener("keydown", (e) => this.updateInput(e.key, true));
        window.addEventListener("keyup", (e) => this.updateInput(e.key, false));
    }

    updateInput(key, value) {
        if (key === "ArrowLeft" || key === "a") this.inputs.left = value;
        if (key === "ArrowRight" || key === "d") this.inputs.right = value;
        if (key === " " || key === "w") this.inputs.jump = value;
        
        this.socket.emit("input:update", this.inputs);
    }
}