import Phaser from "phaser";
import "./style.css";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import type { User } from "@supabase/supabase-js";

type Character = {
  id: string;
  user_id: string;
  name: string;
  level: number;
  experience: number;
  region_id: string;
  position_x: number;
  position_y: number;
};

class MeadowScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() { super("Meadow"); }

  create() {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x9fca83, 1);
    graphics.fillRect(0, 0, width, height);

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

    graphics.fillStyle(0x72b8c2, 1);
    graphics.fillEllipse(width * 0.78, height * 0.22, 112, 58);
    graphics.lineStyle(3, 0xd5e9d8, 0.8);
    graphics.strokeEllipse(width * 0.78, height * 0.22, 112, 58);

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

  setPlayerPosition(x: number, y: number) {
    if (!this.player) return;
    this.player.setPosition(
      Phaser.Math.Clamp(x, 12, this.scale.width - 12),
      Phaser.Math.Clamp(y, 18, this.scale.height - 12)
    );
  }

  getPlayerPosition() {
    return { x: Math.round(this.player?.x ?? 380), y: Math.round(this.player?.y ?? 250) };
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.keys || !this.cursors) return;
    const speed = 190;
    let dx = 0, dy = 0;
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
const game = new Phaser.Game(config);

const authPanel = document.querySelector<HTMLElement>("#auth-panel")!;
const characterPanel = document.querySelector<HTMLElement>("#character-panel")!;
const gameLayout = document.querySelector<HTMLElement>("#game-layout")!;
const statusText = document.querySelector<HTMLElement>("#status-text")!;
const message = document.querySelector<HTMLElement>("#message")!;
const authForm = document.querySelector<HTMLFormElement>("#auth-form")!;
const characterForm = document.querySelector<HTMLFormElement>("#character-form")!;
const logoutButton = document.querySelector<HTMLButtonElement>("#logout-button")!;
const playerName = document.querySelector<HTMLElement>("#player-name")!;
const levelText = document.querySelector<HTMLElement>("#level-text")!;
const expText = document.querySelector<HTMLElement>("#exp-text")!;
const isConfigured = isSupabaseConfigured;
let currentUser: User | null = null;
let currentCharacter: Character | null = null;
let lastSavedPosition = "";

function showMessage(text: string, isError = false) {
  message.textContent = text;
  message.dataset.type = isError ? "error" : "success";
}
function showScreen(screen: "auth" | "character" | "game") {
  authPanel.hidden = screen !== "auth";
  characterPanel.hidden = screen !== "character";
  gameLayout.hidden = screen !== "game";
  logoutButton.hidden = screen === "auth";
}
function updateCharacterUI(character: Character) {
  playerName.textContent = character.name;
  levelText.textContent = `Lv. ${character.level}`;
  expText.textContent = `EXP ${character.experience}`;
}
async function loadOrCreateProfile(user: User) {
  if (!supabase) return;
  const displayName = String(user.user_metadata?.display_name || user.email?.split("@")[0] || "冒険者").slice(0, 20);
  const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });
  if (error) throw error;
}
async function loadCharacter(user: User) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("characters").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return data as Character | null;
}
async function enterForUser(user: User) {
  if (!supabase) return;
  currentUser = user;
  try {
    await loadOrCreateProfile(user);
    currentCharacter = await loadCharacter(user);
    if (!currentCharacter) {
      showScreen("character");
      showMessage("冒険者の名前を決めて、キャラクターを作成しよう。");
      return;
    }
    showScreen("game");
    updateCharacterUI(currentCharacter);
    const scene = game.scene.getScene("Meadow") as MeadowScene;
    if (scene.scene.isActive()) scene.setPlayerPosition(currentCharacter.position_x, currentCharacter.position_y);
    else game.events.once("ready", () => scene.setPlayerPosition(currentCharacter!.position_x, currentCharacter!.position_y));
    showMessage("");
  } catch (error) {
    showScreen("auth");
    showMessage(error instanceof Error ? error.message : "データの読み込みに失敗しました。", true);
  }
}

if (!isConfigured) {
  statusText.textContent = "Supabase未設定";
  showScreen("auth");
  showMessage("Supabaseの環境変数がまだ読み込まれていません。Vercelの設定を確認してください。", true);
} else {
  statusText.textContent = "Supabase接続設定あり";
  supabase!.auth.getSession().then(({ data, error }) => {
    if (error) showMessage(error.message, true);
    else if (data.session) void enterForUser(data.session.user);
    else showScreen("auth");
  });
  supabase!.auth.onAuthStateChange((_event, session) => {
    if (session?.user) void enterForUser(session.user);
    else {
      currentUser = null;
      currentCharacter = null;
      showScreen("auth");
    }
  });
}

authForm.querySelectorAll<HTMLButtonElement>("button[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    const modeInput = authForm.querySelector<HTMLInputElement>('input[name="mode"]');
    if (modeInput) modeInput.value = button.dataset.mode || "login";
  });
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return showMessage("Supabaseの接続設定がありません。", true);
  const form = new FormData(authForm);
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const displayName = String(form.get("displayName") || "冒険者").trim().slice(0, 20);
  const mode = String(form.get("mode") || "login");
  const submit = authForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  submit.disabled = true;
  try {
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { display_name: displayName } }
      });
      if (error) throw error;
      if (data.session) await enterForUser(data.session.user);
      else showMessage("登録メールを送信しました。メール内の確認リンクを開いてからログインしてください。");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showMessage("ログインしました。");
    }
  } catch (error) {
    showMessage(error instanceof Error ? error.message : "認証に失敗しました。", true);
  } finally {
    submit.disabled = false;
  }
});

characterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase || !currentUser) return;
  const name = String(new FormData(characterForm).get("characterName") || "").trim();
  if (name.length < 1 || name.length > 16) return showMessage("名前は1〜16文字で入力してください。", true);
  const button = characterForm.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  button.disabled = true;
  try {
    const { data, error } = await supabase.from("characters").insert({
      user_id: currentUser.id, name, level: 1, experience: 0,
      region_id: "starting_meadow", position_x: 380, position_y: 250
    }).select("*").single();
    if (error) throw error;
    currentCharacter = data as Character;
    showScreen("game");
    updateCharacterUI(currentCharacter);
    showMessage("キャラクターを作成しました！");
    const scene = game.scene.getScene("Meadow") as MeadowScene;
    if (scene.scene.isActive()) scene.setPlayerPosition(380, 250);
  } catch (error) {
    showMessage(error instanceof Error ? error.message : "キャラクター作成に失敗しました。", true);
  } finally {
    button.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) showMessage(error.message, true);
});

window.setInterval(async () => {
  if (!supabase || !currentUser || !currentCharacter || !game.scene.isActive("Meadow")) return;
  const scene = game.scene.getScene("Meadow") as MeadowScene;
  const pos = scene.getPlayerPosition();
  const key = `${pos.x},${pos.y}`;
  if (key === lastSavedPosition) return;
  const { error } = await supabase.from("characters").update({
    position_x: pos.x, position_y: pos.y, updated_at: new Date().toISOString()
  }).eq("id", currentCharacter.id).eq("user_id", currentUser.id);
  if (!error) lastSavedPosition = key;
  else console.warn("位置の保存に失敗しました", error.message);
}, 5000);
