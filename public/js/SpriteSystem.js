class SpriteSystem {
  renderPlayer(ctx, player) {
    ctx.fillStyle = player.color;

    ctx.fillRect(
      player.body.position.x - 20,
      player.body.position.y - 20,
      40,
      40
    );
  }
}