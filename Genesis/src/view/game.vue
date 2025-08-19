<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Phaser from "phaser";
import { GameObjectBase } from "@/models/gameObjects/gameObjectBase";
import { Color } from "@/models/color";
import { GridBackground } from "@/models/gameObjects/gridBackground";
import { Ground } from "@/models/gameObjects/ground";
import { Rocket } from "@/models/gameObjects/Rocket";
import { Vector } from "matter";

const frameRate = ref(0);

let mapWidth: number = 1000;
let mapHeight: number = 1000;

class GameScene extends Phaser.Scene {
  backgroundGrid: GridBackground;
  ground: Ground;
  rockets: Rocket[] = [];  
  gridSize: number = 50;
  
  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;

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
    for(let i = 0; i < 1; i++) {
      this.rockets.push(new Rocket(this, Phaser.Math.Between(0, mapWidth), Phaser.Math.Between(0, mapHeight)));
    }

    this.cursorKeys = this.input.keyboard.createCursorKeys();

  }

  update() {
    if(this.cursorKeys.up.isDown){
      this.rockets.forEach(rocket => {
        rocket.handleThrust();
      });
    }
    if(this.cursorKeys.left.isDown){
      this.rockets.forEach(rocket => {
        rocket.stearLeft();
      });
    }
    if(this.cursorKeys.right.isDown){
      this.rockets.forEach(rocket => {
        rocket.stearRight();
      });
    }
    let serfaces = this.getInteractiveSerfaces();
    this.rockets.forEach(rocket => {
      rocket.update(serfaces);
    });
    frameRate.value = this.game.loop.actualFps;
  }
  getInteractiveSerfaces(): Phaser.Geom.Line[] {
    let interactiveSerfaces : Phaser.Geom.Line[] = [];
    // world bounds
    interactiveSerfaces.push(new Phaser.Geom.Line(0, 0, mapWidth, 0)); // top
    interactiveSerfaces.push(new Phaser.Geom.Line(mapWidth, 0, mapWidth, mapHeight)); // right
    interactiveSerfaces.push(new Phaser.Geom.Line(mapWidth, mapHeight, 0, mapHeight)); // bottom
    interactiveSerfaces.push(new Phaser.Geom.Line(0, mapHeight, 0, 0)); // left

    // ground
    interactiveSerfaces = interactiveSerfaces.concat(this.ground.getSerfaces());

    return interactiveSerfaces;
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
            debug: true,
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
