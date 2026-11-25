import Phaser from "phaser";
import "./style.css";

class MeadowScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() {
    super("Meadow");
  }

  create() {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();

    graphics.fillStyle(0x9fca83, 1);
    graphics.fillRect(0, 0, width, height);

    // Simple, reusable scenery shapes for the prototype.
    for (let i = 0; i < 34; i++) {
      const x = Phaser.Math.Between(18, width - 18);
      const y = Phaser.Math.Between(18, height - 18);
      graphics.fillStyle(i % 2 ? 0x7fb66f : 0xb5d78f, 0.75);
      graphics.fillCircle(x, y, Phaser.Math.Between(3, 8));
    }

    graphics.lineStyle(5, 0xd6c18c, 1);
    graphics.beginPath();
    graphics.moveTo(0, height * 0.78);
    graphics.lineTo(width * 0.28, height * 0.68);
    graphics.lineTo(width * 0.56, height * 0.73);
    graphics.lineTo(width, height * 0.58);
    graphics.strokePath();

    // Pond
    graphics.fillStyle(0x72b8c2, 1);
    graphics.fillEllipse(width * 0.78, height * 0.22, 112, 58);
    graphics.lineStyle(3, 0xd5e9d8, 0.8);
    graphics.strokeEllipse(width * 0.78, height * 0.22, 112, 58);

    // A small signpost
    graphics.fillStyle(0x795438, 1);
    graphics.fillRect(width * 0.2, height * 0.3, 5, 24);
    graphics.fillStyle(0xe8d6a5, 1);
    graphics.fillRoundedRect(width * 0.2 - 12, height * 0.29, 30, 13, 3);

    this.player = this.add.container(width / 2, height / 2);
    const shadow = this.add.ellipse(1, 8, 23, 10, 0x34513a, 0.25);
    const body = this.add.circle(0, 0, 10, 0x416fba);
    body.setStrokeStyle(2, 0xffffff, 0.9);
    const face = this.add.circle(0, -2, 3, 0xf4dfc4);
    this.player.add([shadow, body, face]);
    this.player.setDepth(10);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    }

    this.add.text(14, 12, "はじまりの草原", {
      fontFamily: "sans-serif", fontSize: "14px", color: "#24432d",
      backgroundColor: "#ffffffbb", padding: { x: 8, y: 5 }
    }).setScrollFactor(0).setDepth(20);
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.keys) return;
    const speed = 190;
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;
    const length = Math.hypot(dx, dy) || 1;
    this.player.x = Phaser.Math.Clamp(this.player.x + (dx / length) * speed * delta / 1000, 12, this.scale.width - 12);
    this.player.y = Phaser.Math.Clamp(this.player.y + (dy / length) * speed * delta / 1000, 18, this.scale.height - 12);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 760,
  height: 500,
  backgroundColor: "#9fca83",
  pixelArt: false,
  scene: [MeadowScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
};

new Phaser.Game(config);