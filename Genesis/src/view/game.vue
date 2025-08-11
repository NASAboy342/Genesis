<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import Phaser from "phaser";
import { GameObjectBase } from "@/models/gameObjects/gameObjectBase";
import { Color } from "@/models/color";
import { GridBackground } from "@/models/gameObjects/gridBackground";
import { Ground } from "@/models/gameObjects/ground";
import { Rocket } from "@/models/gameObjects/Rocket";

class GameScene extends Phaser.Scene {
  backgroundGrid: GridBackground;
  ground: Ground;
  rocket: Rocket;
  mapWidth: number = 1000;
  mapHeight: number = 1000;
  gridSize: number = 50;
  constructor() {
    super({ key: "GameScene" });
  }

  preload() {}

  create() {
    this.backgroundGrid = new GridBackground(
      this,
      this.mapWidth,
      this.mapHeight,
      this.gridSize
    );
    this.ground = new Ground(this, 0, this.mapHeight, this.mapWidth);
    this.rocket = new Rocket(this, this.mapWidth / 2, this.mapHeight / 2);
  }

  update() {
    this.rocket.update();
  }
}

let game: Phaser.Game | null = null;

let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

onMounted(() => {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: windowWidth,
    height: windowHeight,
    parent: "game-container",
    physics: {
          default: "matter", // ✅ use Matter.js
          matter: {
            gravity: { x: 0, y: 0.1}, // normal downward gravity
            debug: true
          }
        },
    scene: GameScene,
  });
});

onUnmounted(() => {
  game?.destroy(true);
});
</script>

<template>
  <div id="game-container"></div>
</template>

<style scoped>
#game-container {
  width: 100%;
  height: 100%;
  margin: auto;
}
</style>
