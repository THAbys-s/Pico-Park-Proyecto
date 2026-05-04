class NetworkManager {
  constructor(playerManager) {
    this.socket = io();
    this.playerManager = playerManager;

    console.log("NetworkManager iniciado");

    this.socket.on("connect", () => {
      console.log("Conectado al servidor:", this.socket.id);
    });

    this.socket.on("players:update", (players) => {
      Object.entries(players).forEach(([id, input]) => {

        // crear jugador si no existe
        if (!this.playerManager.players[id]) {
          this.playerManager.addPlayer(id, 100, 100);
        }

        // actualizar inputs
        this.playerManager.players[id].input = input;
      });
    });
  }
}