class SpriteSystem {
    renderPlayer(ctx, player) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.fillStyle = player.color;
        ctx.fillRect(-15, -15, 30, 30);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, -15, 30, 30);
        
        // Ojos (para saber a dónde miran)
        ctx.fillStyle = "white";
        ctx.fillRect(5, -10, 5, 5);
        ctx.restore();
    }

    renderEntity(ctx, ent) {
        ctx.save();
        ctx.translate(ent.x, ent.y);
        
        if (ent.type === "key") {
            ctx.fillStyle = "gold";
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (ent.type === "door") {
            ctx.fillStyle = "#E91E63";
            ctx.fillRect(-ent.w/2, -ent.h/2, ent.w, ent.h);
        } else {
            ctx.fillStyle = "#555"; // Suelo y plataformas
            ctx.fillRect(-ent.w/2, -ent.h/2, ent.w, ent.h);
        }
        ctx.restore();
    }
}