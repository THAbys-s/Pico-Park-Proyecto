class MapSystem {
    constructor() {
        this.entities = [];
        this.sprites = new SpriteSystem();
    }

    setEntities(data) {
        this.entities = data;
    }

    render(ctx) {
        for (let i = 0; i < this.entities.length; i++) {
            this.sprites.renderEntity(ctx, this.entities[i]);
        }
    }
}