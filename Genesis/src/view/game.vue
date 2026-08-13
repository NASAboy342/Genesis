<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Phaser from "phaser";
import { GameObjectBase } from "@/models/gameObjects/gameObjectBase";
import { Color } from "@/models/color";
import { GridBackground } from "@/models/gameObjects/gridBackground";
import { Ground } from "@/models/gameObjects/ground";
import { Rocket } from "@/models/gameObjects/rocket";
import { Vector } from "matter";
import { MatterCategory } from "@/models/matterCategory";
import { WayPoint } from "@/models/gameObjects/wayPoint";
import { Clock } from "@/models/clock";
import { serializeNeuralNetwork } from "@/models/ai/neuralNetwork";
import { DataBaseApiHelper } from "@/utils/NeuralNetworkApiHelper";
import { useRouter } from "vue-router";
import { c } from "vite/dist/node/moduleRunnerTransport.d-CXw_Ws6P";
import { TrainingRecord } from "@/models/trainingRecord";

const router = useRouter();
const frameRate = ref(0);

let mapWidth: number = 2000;
let mapHeight: number = 1000;

const bestNeuralNetworkJson = ref(
  (router.currentRoute.value.query.neuralNetworkInJsonString as string) || ""
);
const cyclesCompleted = ref(0);

const copyBestNeuralNetwork = () => {
  if (!bestNeuralNetworkJson.value || bestNeuralNetworkJson.value === "") {
    return;
  }
  navigator.clipboard
    .writeText(bestNeuralNetworkJson.value)
    .then(() => {
      console.log("Neural network copied to clipboard");
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
    });
};

const highestScore = ref(0);
const highestScoreRecord = ref(0);

class GameScene extends Phaser.Scene {
  backgroundGrid: GridBackground;
  ground: Ground;
  rockets: Rocket[] = [];
  gridSize: number = 50;
  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  matterCategory: MatterCategory;
  rocketWayPoint: WayPoint;
  clock: Clock;
  highestScoredRocketNeuralNetWork: string = bestNeuralNetworkJson.value || "";
  cameraXVelocity: number = 0;
  cameraYVelocity: number = 0;

  previousRocketId: number = 0;

  markBestRocketIntervalInSec: number = 1;
  lastMarkBestRocketTimeInSec: number = 0;
  bestRocketId: number = 0;
  mutationRate: number = 0.5;
  records: TrainingRecord[] = [];

  constructor() {
    super({ key: "GameScene" });
  }

  preload() {}

  create() {
    this.matterCategory = new MatterCategory(this);
    this.backgroundGrid = new GridBackground(
      this,
      mapWidth,
      mapHeight,
      this.gridSize
    );
    this.setCollisionToWorldBounds();
    this.ground = new Ground(
      this,
      mapWidth / 2,
      mapHeight,
      mapWidth,
      this.matterCategory
    );
    this.spawnRockets();
    this.rocketWayPoint = new WayPoint(this, mapWidth / 1.3, mapHeight / 3);
    this.cursorKeys = this.input.keyboard.createCursorKeys();
    this.clock = new Clock();
  }
  setCollisionToWorldBounds() {
    const walls = this.matter.world.walls;
    [walls.left, walls.right, walls.top, walls.bottom].forEach(
      (w: MatterJS.BodyType) => {
        w.collisionFilter.category = this.matterCategory.static;
        w.collisionFilter.mask = this.matterCategory.rocket;
      }
    );
  }
  spawnRockets() {
    let rocketStartPoint = new Phaser.Math.Vector2(
      mapWidth / 1.2,
      mapHeight - 70
    );
    for (let i = 0; i < 200; i++) {
      this.rockets.push(
        new Rocket(
          this.previousRocketId++,
          this,
          rocketStartPoint.x,
          rocketStartPoint.y,
          this.matterCategory,
          this.highestScoredRocketNeuralNetWork === ""
            ? ""
            : this.highestScoredRocketNeuralNetWork,
          this.mutationRate
        )
      );
    }
  }

  update() {
    this.checkIfToRecycleGame();
    this.listenForInput();
    this.scrollCamera();
    let surfaces = this.getInteractiveSerfaces();
    this.rockets.forEach((rocket) => {
      rocket.update(surfaces, this.rocketWayPoint);
    });
    this.markTheBestRocket();
    frameRate.value = this.game.loop.actualFps;
    this.clock.aging();
  }
  markTheBestRocket() {
    if (this.clock.ageInSec - this.lastMarkBestRocketTimeInSec > this.markBestRocketIntervalInSec){
      this.bestRocketId = this.rockets.sort((a, b) => b.score - a.score)[0].id;
      this.lastMarkBestRocketTimeInSec = this.clock.ageInSec;
    }
    this.rockets.find(r => r.id === this.bestRocketId)?.markAsBest();
  }
  checkIfToRecycleGame() {
    if (this.clock.ageInSec > 60 || this.rockets.every((r) => r.isBroken)) {
      this.recycleGame();
    }
  }
  recycleGame() {
    this.extractHighestScoredRocketNeuralNetwork();
      this.rockets.forEach((rocket) => {
        rocket.destroy(true);
      });
      this.lastMarkBestRocketTimeInSec = 0;
      cyclesCompleted.value += 1;
      var thisCycleRecord = this.getThisCycleTrainingRecord();
      this.records.push(thisCycleRecord);
      this.rockets = [];
      this.spawnRockets();
      this.clock.reset();
  }
  getThisCycleTrainingRecord(): TrainingRecord {
    var newTrainingRecord = new TrainingRecord();
    newTrainingRecord.cycleNumber = cyclesCompleted.value;
    newTrainingRecord.highestScore = highestScore.value;
    newTrainingRecord.highestScoreRecord = highestScoreRecord.value;
    newTrainingRecord.bestNeuralNetworkJson = this.highestScoredRocketNeuralNetWork;
    newTrainingRecord.highestScoreRocket = this.rockets.sort((a, b) => b.score - a.score)[0];
    newTrainingRecord.LostScore = newTrainingRecord.highestScoreRocket.LostScore;
    return newTrainingRecord;
  }
  async extractHighestScoredRocketNeuralNetwork() {
    let highestScoredRocket = this.rockets.sort((a, b) => b.score - a.score)[0];
    highestScore.value = highestScoredRocket.score;
    highestScoreRecord.value = highestScore.value > highestScoreRecord.value ? highestScore.value : highestScoreRecord.value;
    let newHighestScoredRocketNeuralNetWork = serializeNeuralNetwork(
      highestScoredRocket.neuralNetwork
    );
    this.mutationRate = newHighestScoredRocketNeuralNetWork > this.highestScoredRocketNeuralNetWork ? 0.5 : 0.9;
    this.highestScoredRocketNeuralNetWork = newHighestScoredRocketNeuralNetWork;
    bestNeuralNetworkJson.value = this.highestScoredRocketNeuralNetWork;
    this.saveInToDataBase(this.highestScoredRocketNeuralNetWork);
  }
  async saveInToDataBase(highestScoredRocketNeuralNetWork: string) {
    try {
      const data = await DataBaseApiHelper.saveRawData(highestScoredRocketNeuralNetWork);
    } catch (error) {
      console.error("Failed to send neural network data:", error);
    }
  }

  listenForInput() {
    if (this.cursorKeys.up.isDown) {
      this.pendingCameraUp();
    }
    if (this.cursorKeys.left.isDown) {
      this.pendingCameraLeft();
    }
    if (this.cursorKeys.right.isDown) {
      this.pendingCameraRight();
    }
    if (this.cursorKeys.down.isDown) {
      this.pendingCameraDown();
    }
  }
  scrollCamera() {
    this.cameras.main.scrollX += this.cameraXVelocity;
    this.cameras.main.scrollY += this.cameraYVelocity;
    this.cameraXVelocity *= 0.95; // Dampen the velocity
    this.cameraYVelocity *= 0.95; // Dampen the velocity
    if (Math.abs(this.cameraXVelocity) < 0.1) this.cameraXVelocity = 0;
    if (Math.abs(this.cameraYVelocity) < 0.1) this.cameraYVelocity = 0;
  }
  pendingCameraDown() {
    this.cameraYVelocity += 1;
  }
  pendingCameraRight() {
    this.cameraXVelocity += 1;
  }
  pendingCameraLeft() {
    this.cameraXVelocity -= 1;
  }
  pendingCameraUp() {
    this.cameraYVelocity -= 1;
  }
  getInteractiveSerfaces(): Phaser.Geom.Line[] {
    let interactiveSerfaces: Phaser.Geom.Line[] = [];
    // world bounds
    interactiveSerfaces.push(new Phaser.Geom.Line(0, 0, mapWidth, 0)); // top
    interactiveSerfaces.push(
      new Phaser.Geom.Line(mapWidth, 0, mapWidth, mapHeight)
    ); // right
    interactiveSerfaces.push(
      new Phaser.Geom.Line(mapWidth, mapHeight, 0, mapHeight)
    ); // bottom
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
        gravity: { x: 0, y: 1 }, // normal downward gravity
        debug: false,
        setBounds: {
          x: 0,
          y: 0,
          width: mapWidth,
          height: mapHeight,
        },
      },
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
  <div class="info-panel">
    <div class="fps-display">FPS: {{ frameRate }}</div>
    <div class="fps-display">CompletedCycles: {{ cyclesCompleted }}</div>
    <div class="fps-display">Highest Score: {{ highestScore }}</div>
    <div class="fps-display">Highest Score Record: {{ highestScoreRecord }}</div>
    <div class="copy-button" @click="copyBestNeuralNetwork">
      Copy best Neural in Json
    </div>
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
  background-color: transparent;
  color: white;
}
.copy-button {
  position: relative;
  width: fit-content;
  background-color: #4caf50;
  color: white;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
}
.copy-button:hover {
  background-color: #45a049;
}
.info-panel {
  position: absolute;
  top: 50px;
  left: 10px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
