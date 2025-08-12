<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Phaser from "phaser";
import { GameObjectBase } from "@/models/gameObjects/gameObjectBase";
import { Color } from "@/models/color";
import { GridBackground } from "@/models/gameObjects/gridBackground";
import { Ground } from "@/models/gameObjects/ground";
import { Rocket } from "@/models/gameObjects/Rocket";

const frameRate = ref(0);

let mapWidth: number = 1000;
let mapHeight: number = 1000;

class GameScene extends Phaser.Scene {
  backgroundGrid: GridBackground;
  ground: Ground;
  rocket: Rocket[] = [];
  
  gridSize: number = 50;
  constructor() {
    super({ key: "GameScene" });
  }

  preload() {}

  create() {
    this.backgroundGrid = new GridBackground(
      this,
      mapWidth,
      mapHeight,
      this.gridSize
    );
    this.ground = new Ground(this, mapWidth / 2, mapHeight, mapWidth);
    for (let i = 0; i < 200; i++) {
      this.rocket.push(new Rocket(this, Phaser.Math.Between(0, mapWidth), Phaser.Math.Between(0, mapHeight)));
    }
  }

  update() {
    frameRate.value = this.game.loop.actualFps;
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
    fps: {
      target: 60,
      forceSetTimeOut: true, // Use setTimeout for frame rate control
    },
    physics: {
          default: "matter", // ✅ use Matter.js
          matter: {
            gravity: { x: 0, y: 1}, // normal downward gravity
            debug: false,
            setBounds: {
              x: 0,
              y: 0,
              width: mapWidth,
              height: mapHeight,
            }
            
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
  <div class="fps-display">
    FPS: {{ frameRate }}
  </div>
</template>

<style scoped>
#game-container {
  position: absolute;
  width: 100%;
  height: 100%;
  margin: auto;
}
.fps-display {
  position: relative;
  top: 50px;
  left: 10px;
  background-color: transparent;;
  color: white;
}
</style>
