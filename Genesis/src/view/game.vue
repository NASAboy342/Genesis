<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import Phaser from "phaser";
import { GameObjectBase } from "@/models/gameObjects/gameObjectBase";
import { GridBackground } from "@/models/gameObjects/gridBackground";
import { Ground } from "@/models/gameObjects/ground";
import { Rocket } from "@/models/gameObjects/rocket";
import { MatterCategory } from "@/models/matterCategory";
import { WayPoint } from "@/models/gameObjects/wayPoint";
import { Clock } from "@/models/clock";
import { serializeNeuralNetwork } from "@/models/ai/neuralNetwork";
import { DataBaseApiHelper } from "@/utils/NeuralNetworkApiHelper";
import { useRouter } from "vue-router";
import { TrainingRecord } from "@/models/trainingRecord";

const router = useRouter();
const frameRate = ref(0);
const showTrainingDashboard = ref(false);

type DashboardRecord = {
  cycleNumber?: number;
  highestScore?: number;
  highestScoreRecord?: number;
  bestNeuralNetworkJson?: string;
  highestScoreRocket?: {
    id?: number;
    isBroken?: boolean;
    acceleration?: number;
    loopCounter?: number;
    x?: number;
    y?: number;
    neuralNetwork?: {
      layers?: Array<{
        neurons?: Array<{
          weights?: number[];
          activationType?: unknown;
        }>;
      }>;
    };
  } | null;
  LostScore?: number;
};

const trainingRecords = ref<DashboardRecord[]>([]);

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

type NeuralNetworkSummary = {
  layerCount: number;
  neuronCounts: number[];
  totalNeurons: number;
  totalWeights: number;
  activationTypes: string[];
  jsonLength: number;
};

type LineSeries = {
  points: string;
  min: number;
  max: number;
  first: number;
  last: number;
};

type BarSeries = {
  bars: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    value: number;
  }>;
  max: number;
};

const activationTypeLabels = [
  "HardSigmoid",
  "Sigmoid",
  "Tanh",
  "ReLU",
  "LeakyReLU",
  "Softmax",
];

function safeNumber(value: number | undefined | null, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function formatNumber(value: number | undefined | null, digits = 1) {
  return safeNumber(value).toFixed(digits);
}

function formatPercent(value: number | undefined | null) {
  return `${formatNumber(value, 1)}%`;
}

function getActivationTypeLabel(value: unknown) {
  if (typeof value === "number" && activationTypeLabels[value]) {
    return activationTypeLabels[value];
  }

  return String(value ?? "Unknown");
}

function getNetworkSummaryFromJson(json?: string): NeuralNetworkSummary | null {
  if (!json) {
    return null;
  }

  try {
    const parsed = JSON.parse(json);
    const layers = Array.isArray(parsed?.layers) ? parsed.layers : [];
    const neuronCounts: number[] = layers.map((layer: any) =>
      Array.isArray(layer?.neurons) ? layer.neurons.length : 0
    );
    const activationTypes = Array.from(
      new Set(
        layers.flatMap((layer: any) =>
          Array.isArray(layer?.neurons)
            ? layer.neurons.map((neuron: any) =>
                getActivationTypeLabel(neuron?.activationType)
              )
            : []
        )
      )
    ) as string[];

    return {
      layerCount: layers.length,
      neuronCounts,
      totalNeurons: neuronCounts.reduce<number>(
        (sum: number, count: number) => sum + count,
        0
      ),
      totalWeights: layers.reduce((weightSum: number, layer: any) => {
        const layerWeightCount = Array.isArray(layer?.neurons)
          ? layer.neurons.reduce(
              (sum: number, neuron: any) => sum + (neuron?.weights?.length ?? 0),
              0
            )
          : 0;

        return weightSum + layerWeightCount;
      }, 0),
      activationTypes,
      jsonLength: json.length,
    };
  } catch {
    return {
      layerCount: 0,
      neuronCounts: [],
      totalNeurons: 0,
      totalWeights: 0,
      activationTypes: [],
      jsonLength: json.length,
    };
  }
}

function createLineSeries(values: number[], width = 100, height = 40): LineSeries {
  if (!values.length) {
    return {
      points: "",
      min: 0,
      max: 0,
      first: 0,
      last: 0,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const horizontalStep = values.length > 1 ? width / (values.length - 1) : 0;

  return {
    points: values
      .map((value, index) => {
        const x = values.length > 1 ? index * horizontalStep : width / 2;
        const normalized = (value - min) / range;
        const y = height - normalized * height;

        return `${x},${y}`;
      })
      .join(" "),
    min,
    max,
    first: values[0],
    last: values[values.length - 1],
  };
}

function createBarSeries(values: number[], width = 100, height = 40): BarSeries {
  if (!values.length) {
    return {
      bars: [],
      max: 0,
    };
  }

  const max = Math.max(...values, 1);
  const barSpacing = 1;
  const barWidth = width / values.length - barSpacing;

  return {
    bars: values.map((value, index) => {
      const barHeight = (value / max) * (height - 2);
      const x = index * (width / values.length);
      const y = height - barHeight;

      return {
        x,
        y,
        width: Math.max(barWidth, 0.5),
        height: barHeight,
        value,
      };
    }),
    max,
  };
}

const orderedTrainingRecords = computed(() =>
  [...trainingRecords.value].sort(
    (a, b) => safeNumber(a.cycleNumber) - safeNumber(b.cycleNumber)
  )
);

const latestTrainingRecord = computed(() => {
  const records = orderedTrainingRecords.value;
  return records.length ? records[records.length - 1] : null;
});

const previousTrainingRecord = computed(() => {
  const records = orderedTrainingRecords.value;
  return records.length > 1 ? records[records.length - 2] : null;
});

const bestTrainingRecord = computed<DashboardRecord | null>(() => {
  let bestRecord: DashboardRecord | null = null;

  for (const record of orderedTrainingRecords.value) {
    if (
      !bestRecord ||
      safeNumber(record.highestScore) > safeNumber(bestRecord.highestScore)
    ) {
      bestRecord = record;
    }
  }

  return bestRecord;
});

const dashboardStats = computed(() => {
  const records = orderedTrainingRecords.value;
  const latest = latestTrainingRecord.value;
  const previous = previousTrainingRecord.value;
  const best = bestTrainingRecord.value;
  const cycleCount = records.length;
  const averageHighestScore = cycleCount
    ? records.reduce(
        (sum, record) => sum + safeNumber(record.highestScore),
        0
      ) / cycleCount
    : 0;
  const averageLostScore = cycleCount
    ? records.reduce((sum, record) => sum + safeNumber(record.LostScore), 0) /
      cycleCount
    : 0;
  const averageRecordScore = cycleCount
    ? records.reduce(
        (sum, record) => sum + safeNumber(record.highestScoreRecord),
        0
      ) / cycleCount
    : 0;
  const brokenCycles = records.filter(
    (record) => record.highestScoreRocket?.isBroken
  ).length;
  const brokenRate = cycleCount ? (brokenCycles / cycleCount) * 100 : 0;
  const latestImprovement = latest && previous
    ? safeNumber(latest.highestScore) - safeNumber(previous.highestScore)
    : 0;
  const latestGapToBest = latest
    ? safeNumber(latest.highestScoreRecord) - safeNumber(latest.highestScore)
    : 0;
  const averageGapToBest = cycleCount
    ? records.reduce(
        (sum, record) =>
          sum +
          (safeNumber(record.highestScoreRecord) - safeNumber(record.highestScore)),
        0
      ) / cycleCount
    : 0;
  const latestNetworkSummary = getNetworkSummaryFromJson(
    latest?.bestNeuralNetworkJson
  );
  const bestNetworkSummary = getNetworkSummaryFromJson(
    best?.bestNeuralNetworkJson
  );

  return {
    cycleCount,
    latest,
    previous,
    best,
    averageHighestScore,
    averageLostScore,
    averageRecordScore,
    brokenCycles,
    brokenRate,
    latestImprovement,
    latestGapToBest,
    averageGapToBest,
    latestNetworkSummary,
    bestNetworkSummary,
  };
});

const scoreTrendSeries = computed(() =>
  createLineSeries(
    orderedTrainingRecords.value.map((record) => safeNumber(record.highestScore))
  )
);

const scoreRecordTrendSeries = computed(() =>
  createLineSeries(
    orderedTrainingRecords.value.map((record) =>
      safeNumber(record.highestScoreRecord)
    )
  )
);

const lostScoreBarSeries = computed(() =>
  createBarSeries(
    orderedTrainingRecords.value.map((record) => safeNumber(record.LostScore))
  )
);

const recentTrainingRecords = computed(() =>
  [...orderedTrainingRecords.value].slice(-8).reverse()
);

const dashboardNarrative = computed(() => {
  const latest = dashboardStats.value.latest;
  const previous = dashboardStats.value.previous;

  if (!latest) {
    return "Run the simulation for a few cycles to populate the dashboard.";
  }

  const improvement = latest && previous
    ? safeNumber(latest.highestScore) - safeNumber(previous.highestScore)
    : 0;
  const recordGap = safeNumber(latest.highestScoreRecord) - safeNumber(latest.highestScore);
  const brokenCycles = dashboardStats.value.brokenCycles;
  const cycleCount = dashboardStats.value.cycleCount;

  const sentences: string[] = [];

  if (improvement > 0) {
    sentences.push(
      `The latest cycle improved by ${formatNumber(improvement)} points.`
    );
  } else if (improvement < 0) {
    sentences.push(
      `The latest cycle dropped by ${formatNumber(Math.abs(improvement))} points.`
    );
  } else {
    sentences.push("The latest cycle matched the previous score.");
  }

  if (recordGap > 0) {
    sentences.push(
      `It still sits ${formatNumber(recordGap)} points below the running best.`
    );
  } else {
    sentences.push("The latest cycle matched the current running best.");
  }

  if (brokenCycles > 0) {
    sentences.push(
      `${brokenCycles}/${cycleCount} cycles ended with a broken rocket.`
    );
  }

  return sentences.join(" ");
});

class GameScene extends Phaser.Scene {
  backgroundGrid!: GridBackground;
  ground!: Ground;
  rockets: Rocket[] = [];
  gridSize: number = 50;
  cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  matterCategory!: MatterCategory;
  rocketWayPoint!: WayPoint;
  clock!: Clock;
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
    this.cursorKeys = this.input.keyboard!.createCursorKeys();
    this.clock = new Clock();
  }
  setCollisionToWorldBounds() {
    const walls = this.matter.world.walls;
    [walls.left, walls.right, walls.top, walls.bottom].forEach(
      (w) => {
        if (!w) {
          return;
        }
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
          i === 0 ? 0 : this.mutationRate
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
  getBestRocket() {
    if (!this.rockets.length) {
      return undefined;
    }

    return this.rockets.reduce((bestRocket, currentRocket) => {
      if (!bestRocket || currentRocket.score > bestRocket.score) {
        return currentRocket;
      }

      return bestRocket;
    }, undefined as Rocket | undefined);
  }
  markTheBestRocket() {
    if (
      this.clock.ageInSec - this.lastMarkBestRocketTimeInSec >
      this.markBestRocketIntervalInSec
    ) {
      const bestRocket = this.getBestRocket();
      if (bestRocket) {
        this.bestRocketId = bestRocket.id;
      }
      this.lastMarkBestRocketTimeInSec = this.clock.ageInSec;
    }
    this.rockets.find((rocket) => rocket.id === this.bestRocketId)?.markAsBest();
  }
  checkIfToRecycleGame() {
    if (this.clock.ageInSec > 20 || this.rockets.every((r) => r.isBroken)) {
      this.recycleGame();
    }
  }
  recycleGame() {
    this.extractHighestScoredRocketNeuralNetwork();
    this.lastMarkBestRocketTimeInSec = 0;
    cyclesCompleted.value += 1;
    const thisCycleRecord = this.getThisCycleTrainingRecord();
    this.records.push(thisCycleRecord);
    trainingRecords.value = [...this.records];
    this.rockets.forEach((rocket) => {
      rocket.destroy(true);
    });
    this.rockets = [];
    this.spawnRockets();
    this.clock.reset();
  }
  getThisCycleTrainingRecord(): TrainingRecord {
    const newTrainingRecord = new TrainingRecord();
    const highestScoreRocket = this.getBestRocket();

    newTrainingRecord.cycleNumber = cyclesCompleted.value;
    newTrainingRecord.highestScore = highestScore.value;
    newTrainingRecord.highestScoreRecord = highestScoreRecord.value;
    newTrainingRecord.bestNeuralNetworkJson = this.highestScoredRocketNeuralNetWork;
    newTrainingRecord.highestScoreRocket = highestScoreRocket;
    newTrainingRecord.LostScore = highestScoreRocket?.LostScore ?? 0;
    return newTrainingRecord;
  }
  async extractHighestScoredRocketNeuralNetwork() {
    const highestScoredRocket = this.getBestRocket();

    if (!highestScoredRocket) {
      return;
    }

    highestScore.value = highestScoredRocket.score;
    const isNewRecord = highestScore.value > highestScoreRecord.value;
    highestScoreRecord.value =
      highestScore.value > highestScoreRecord.value
        ? highestScore.value
        : highestScoreRecord.value;
    let newHighestScoredRocketNeuralNetWork = serializeNeuralNetwork(
      highestScoredRocket.neuralNetwork
    );
    this.mutationRate = isNewRecord ? 0.5 : 0.9;
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

  <div class="hud-shell">
    <div class="info-panel">
      <div class="fps-display">FPS: {{ frameRate }}</div>
      <div class="fps-display">Completed cycles: {{ cyclesCompleted }}</div>
      <div class="fps-display">Highest score: {{ highestScore }}</div>
      <div class="fps-display">
        Highest score record: {{ highestScoreRecord }}
      </div>
      <button
        class="positive-button hud-button"
        @click="showTrainingDashboard = !showTrainingDashboard"
      >
        {{ showTrainingDashboard ? "Hide dashboard" : "Show dashboard" }}
      </button>
      <button class="copy-button" @click="copyBestNeuralNetwork">
        Copy best neural network JSON
      </button>
    </div>
  </div>

  <transition name="dashboard-fade">
    <div
      v-if="showTrainingDashboard"
      class="dashboard-backdrop"
      @click.self="showTrainingDashboard = false"
    >
      <section class="dashboard-panel">
        <header class="dashboard-header">
          <div>
            <p class="dashboard-eyebrow">Live training analysis</p>
            <h2>Rocket training dashboard</h2>
            <p class="dashboard-subtitle">
              A live summary of score momentum, crash pressure, and neural
              network growth. The training keeps running while this panel is open.
            </p>
          </div>
          <button
            class="negative-button dashboard-close"
            @click="showTrainingDashboard = false"
          >
            Close
          </button>
        </header>

        <div v-if="dashboardStats.cycleCount === 0" class="dashboard-empty">
          <h3>No cycles yet</h3>
          <p>
            Run the simulation to populate cycle history, score trends, and
            network statistics.
          </p>
        </div>

        <template v-else>
          <p class="dashboard-narrative">{{ dashboardNarrative }}</p>

          <section class="metric-grid">
            <article class="metric-card accent-teal">
              <span class="metric-label">Cycles</span>
              <strong class="metric-value">{{ dashboardStats.cycleCount }}</strong>
              <span class="metric-note">Completed training rounds</span>
            </article>
            <article class="metric-card accent-sky">
              <span class="metric-label">Average score</span>
              <strong class="metric-value">
                {{ formatNumber(dashboardStats.averageHighestScore) }}
              </strong>
              <span class="metric-note">Mean of the best rocket per cycle</span>
            </article>
            <article class="metric-card accent-amber">
              <span class="metric-label">Running best</span>
              <strong class="metric-value">
                {{ formatNumber(dashboardStats.best?.highestScore) }}
              </strong>
              <span class="metric-note">
                Best cycle {{ dashboardStats.best?.cycleNumber ?? "-" }}
              </span>
            </article>
            <article class="metric-card accent-rose">
              <span class="metric-label">Average loss</span>
              <strong class="metric-value">
                {{ formatNumber(dashboardStats.averageLostScore) }}
              </strong>
              <span class="metric-note">Penalty accumulated per cycle</span>
            </article>
            <article class="metric-card accent-violet">
              <span class="metric-label">Broken cycles</span>
              <strong class="metric-value">
                {{ dashboardStats.brokenCycles }}
              </strong>
              <span class="metric-note">
                {{ formatPercent(dashboardStats.brokenRate) }} of cycles
              </span>
            </article>
            <article class="metric-card accent-lime">
              <span class="metric-label">Latest gap to best</span>
              <strong class="metric-value">
                {{ formatNumber(dashboardStats.latestGapToBest) }}
              </strong>
              <span class="metric-note">
                Difference between record and latest score
              </span>
            </article>
          </section>

          <section class="chart-grid">
            <article class="chart-card">
              <div class="chart-heading">
                <div>
                  <h3>Score trend</h3>
                  <p>Best score per cycle versus the running record.</p>
                </div>
                <div class="chart-meta">
                  <span>Latest: {{ formatNumber(scoreTrendSeries.last) }}</span>
                  <span>Best: {{ formatNumber(scoreRecordTrendSeries.max) }}</span>
                </div>
              </div>
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" class="chart-svg">
                <line x1="0" y1="39" x2="100" y2="39" class="chart-axis"></line>
                <line x1="0" y1="0" x2="0" y2="40" class="chart-axis"></line>
                <polyline
                  v-if="scoreTrendSeries.points"
                  :points="scoreTrendSeries.points"
                  class="chart-line chart-line-primary"
                ></polyline>
                <polyline
                  v-if="scoreRecordTrendSeries.points"
                  :points="scoreRecordTrendSeries.points"
                  class="chart-line chart-line-secondary"
                ></polyline>
              </svg>
              <div class="chart-legend">
                <span><i class="legend-swatch primary"></i> Latest cycle best score</span>
                <span><i class="legend-swatch secondary"></i> Running record</span>
              </div>
              <div class="chart-footnote">
                Range: {{ formatNumber(scoreTrendSeries.min) }} to {{ formatNumber(scoreRecordTrendSeries.max) }}
              </div>
            </article>

            <article class="chart-card">
              <div class="chart-heading">
                <div>
                  <h3>Lost score pressure</h3>
                  <p>How much score was lost in each cycle.</p>
                </div>
                <div class="chart-meta">
                  <span>Peak loss: {{ formatNumber(lostScoreBarSeries.max) }}</span>
                  <span>Latest: {{ formatNumber(dashboardStats.latest?.LostScore) }}</span>
                </div>
              </div>
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" class="chart-svg">
                <line x1="0" y1="39" x2="100" y2="39" class="chart-axis"></line>
                <line x1="0" y1="0" x2="0" y2="40" class="chart-axis"></line>
                <rect
                  v-for="(bar, index) in lostScoreBarSeries.bars"
                  :key="`${index}-${bar.value}`"
                  :x="bar.x"
                  :y="bar.y"
                  :width="bar.width"
                  :height="bar.height"
                  class="chart-bar"
                ></rect>
              </svg>
              <div class="chart-footnote">
                Bars represent the LostScore value for each cycle.
              </div>
            </article>
          </section>

          <section class="detail-grid">
            <article class="detail-card">
              <h3>Latest cycle snapshot</h3>
              <div class="detail-list">
                <div class="detail-item">
                  <span>Cycle</span>
                  <strong>{{ dashboardStats.latest?.cycleNumber ?? "-" }}</strong>
                </div>
                <div class="detail-item">
                  <span>Score</span>
                  <strong>
                    {{ formatNumber(dashboardStats.latest?.highestScore) }}
                  </strong>
                </div>
                <div class="detail-item">
                  <span>Record</span>
                  <strong>
                    {{ formatNumber(dashboardStats.latest?.highestScoreRecord) }}
                  </strong>
                </div>
                <div class="detail-item">
                  <span>Lost score</span>
                  <strong>{{ formatNumber(dashboardStats.latest?.LostScore) }}</strong>
                </div>
                <div class="detail-item">
                  <span>Trend delta</span>
                  <strong>{{ formatNumber(dashboardStats.latestImprovement) }}</strong>
                </div>
                <div class="detail-item">
                  <span>Gap to best</span>
                  <strong>{{ formatNumber(dashboardStats.latestGapToBest) }}</strong>
                </div>
              </div>

              <div class="rocket-card" v-if="dashboardStats.latest?.highestScoreRocket">
                <h4>Top rocket details</h4>
                <div class="rocket-summary-grid">
                  <div>
                    <span>Rocket id</span>
                    <strong>{{ dashboardStats.latest.highestScoreRocket.id }}</strong>
                  </div>
                  <div>
                    <span>Broken</span>
                    <strong>
                      {{ dashboardStats.latest.highestScoreRocket.isBroken ? "Yes" : "No" }}
                    </strong>
                  </div>
                  <div>
                    <span>Acceleration</span>
                    <strong>
                      {{ formatNumber(dashboardStats.latest.highestScoreRocket.acceleration, 3) }}
                    </strong>
                  </div>
                  <div>
                    <span>Loop count</span>
                    <strong>{{ dashboardStats.latest.highestScoreRocket.loopCounter }}</strong>
                  </div>
                  <div>
                    <span>Position</span>
                    <strong>
                      {{ Math.round(safeNumber(dashboardStats.latest.highestScoreRocket.x)) }},
                      {{ Math.round(safeNumber(dashboardStats.latest.highestScoreRocket.y)) }}
                    </strong>
                  </div>
                  <div>
                    <span>Neural layers</span>
                    <strong>
                      {{ dashboardStats.latest.highestScoreRocket.neuralNetwork?.layers?.length ?? 0 }}
                    </strong>
                  </div>
                </div>
              </div>
            </article>

            <article class="detail-card">
              <h3>Neural network summary</h3>
              <div v-if="dashboardStats.latestNetworkSummary" class="network-summary">
                <div class="detail-item">
                  <span>Layers</span>
                  <strong>{{ dashboardStats.latestNetworkSummary.layerCount }}</strong>
                </div>
                <div class="detail-item">
                  <span>Total neurons</span>
                  <strong>{{ dashboardStats.latestNetworkSummary.totalNeurons }}</strong>
                </div>
                <div class="detail-item">
                  <span>Total weights</span>
                  <strong>{{ dashboardStats.latestNetworkSummary.totalWeights }}</strong>
                </div>
                <div class="detail-item">
                  <span>JSON size</span>
                  <strong>{{ dashboardStats.latestNetworkSummary.jsonLength }}</strong>
                </div>
                <div class="detail-item detail-span">
                  <span>Layer sizes</span>
                  <strong>
                    {{ dashboardStats.latestNetworkSummary.neuronCounts.join(" -> ") || "n/a" }}
                  </strong>
                </div>
                <div class="detail-item detail-span">
                  <span>Activation types</span>
                  <strong>
                    {{ dashboardStats.latestNetworkSummary.activationTypes.join(", ") || "n/a" }}
                  </strong>
                </div>
              </div>

              <div class="network-comparison" v-if="dashboardStats.bestNetworkSummary">
                <h4>Champion network profile</h4>
                <p>
                  Best cycle {{ dashboardStats.best?.cycleNumber ?? "-" }} holds
                  {{ dashboardStats.bestNetworkSummary.layerCount }} layers,
                  {{ dashboardStats.bestNetworkSummary.totalNeurons }} neurons,
                  and {{ dashboardStats.bestNetworkSummary.totalWeights }} weights.
                </p>
              </div>
            </article>
          </section>

          <section class="history-card">
            <div class="chart-heading">
              <div>
                <h3>Recent cycle history</h3>
                <p>Latest cycles, sorted from newest to oldest.</p>
              </div>
              <div class="chart-meta">
                <span>Showing last {{ recentTrainingRecords.length }} cycles</span>
              </div>
            </div>
            <div class="history-table-wrap">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>Cycle</th>
                    <th>Score</th>
                    <th>Record</th>
                    <th>Lost</th>
                    <th>Rocket</th>
                    <th>Broken</th>
                    <th>Neural JSON</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="record in recentTrainingRecords" :key="record.cycleNumber">
                    <td>{{ record.cycleNumber }}</td>
                    <td>{{ formatNumber(record.highestScore) }}</td>
                    <td>{{ formatNumber(record.highestScoreRecord) }}</td>
                    <td>{{ formatNumber(record.LostScore) }}</td>
                    <td>
                      <span v-if="record.highestScoreRocket">#{{ record.highestScoreRocket.id }}</span>
                      <span v-else>-</span>
                    </td>
                    <td>
                      <span
                        class="status-pill"
                        :class="record.highestScoreRocket?.isBroken ? 'status-bad' : 'status-good'"
                      >
                        {{ record.highestScoreRocket?.isBroken ? "Yes" : "No" }}
                      </span>
                    </td>
                    <td>{{ record.bestNeuralNetworkJson?.length ?? 0 }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </section>
    </div>
  </transition>
</template>

<style scoped>
#game-container {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
}
.fps-display {
  position: relative;
  background-color: transparent;
  color: white;
}
.hud-shell {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 20;
}
.info-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  min-width: 240px;
  max-width: 280px;
  border-radius: 18px;
  background: rgba(10, 12, 18, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(16px);
}
.hud-button {
  width: 100%;
  text-align: left;
  border: none;
}
.copy-button {
  position: relative;
  width: 100%;
  background: linear-gradient(135deg, #4caf50, #2f8f68);
  color: white;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  border: none;
  text-align: left;
  font-weight: 600;
}
.copy-button:hover {
  filter: brightness(1.05);
}
.dashboard-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  padding: 16px;
  background: rgba(3, 8, 18, 0.35);
  backdrop-filter: blur(6px);
}
.dashboard-panel {
  width: min(100%, 1040px);
  height: calc(100vh - 32px);
  overflow: auto;
  border-radius: 24px;
  padding: 24px;
  color: #edf2ff;
  background:
    radial-gradient(circle at top right, rgba(94, 115, 255, 0.24), transparent 38%),
    linear-gradient(180deg, rgba(12, 16, 28, 0.96), rgba(8, 11, 20, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.dashboard-header h2 {
  margin: 0;
  font-size: 30px;
}
.dashboard-eyebrow {
  margin: 0 0 6px;
  color: #93a8ff;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.dashboard-subtitle,
.chart-card p,
.network-comparison p,
.dashboard-empty p {
  color: rgba(237, 242, 255, 0.74);
}
.dashboard-close {
  border: none;
}
.dashboard-narrative {
  margin: 18px 0 0;
  color: rgba(237, 242, 255, 0.88);
}
.dashboard-empty {
  margin-top: 20px;
  padding: 40px;
  text-align: center;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 18px;
}
.metric-card,
.chart-card,
.detail-card,
.history-card {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
}
.metric-card {
  padding: 14px;
}
.metric-label,
.detail-item span,
.chart-meta,
.chart-footnote,
.history-table th {
  color: rgba(237, 242, 255, 0.62);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
}
.metric-value {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  line-height: 1;
}
.metric-note {
  display: block;
  margin-top: 8px;
  color: rgba(237, 242, 255, 0.72);
  font-size: 13px;
}
.accent-teal {
  box-shadow: inset 0 0 0 1px rgba(79, 236, 215, 0.1);
}
.accent-sky {
  box-shadow: inset 0 0 0 1px rgba(81, 165, 255, 0.1);
}
.accent-amber {
  box-shadow: inset 0 0 0 1px rgba(255, 187, 83, 0.1);
}
.accent-rose {
  box-shadow: inset 0 0 0 1px rgba(255, 119, 146, 0.1);
}
.accent-violet {
  box-shadow: inset 0 0 0 1px rgba(173, 135, 255, 0.1);
}
.accent-lime {
  box-shadow: inset 0 0 0 1px rgba(153, 255, 137, 0.1);
}
.chart-grid,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}
.chart-card,
.detail-card,
.history-card {
  padding: 16px;
}
.chart-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.chart-heading h3,
.detail-card h3,
.history-card h3,
.rocket-card h4,
.network-comparison h4 {
  margin: 0 0 6px;
}
.chart-heading p {
  margin: 0;
  font-size: 13px;
}
.chart-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  white-space: nowrap;
}
.chart-svg {
  width: 100%;
  height: 210px;
  display: block;
  overflow: visible;
}
.chart-axis {
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 0.6;
}
.chart-line {
  fill: none;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.chart-line-primary {
  stroke: #7de2ff;
}
.chart-line-secondary {
  stroke: #ffb366;
}
.chart-bar {
  fill: rgba(255, 204, 102, 0.72);
}
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  color: rgba(237, 242, 255, 0.78);
  font-size: 13px;
}
.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  display: inline-block;
}
.legend-swatch.primary {
  background: #7de2ff;
}
.legend-swatch.secondary {
  background: #ffb366;
}
.chart-footnote {
  margin-top: 8px;
}
.detail-list,
.rocket-summary-grid,
.network-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 12px;
}
.detail-item {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
}
.detail-item strong {
  display: block;
  margin-top: 6px;
  font-size: 15px;
  color: #ffffff;
}
.detail-span {
  grid-column: 1 / -1;
}
.rocket-card,
.network-comparison {
  margin-top: 14px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.history-card {
  margin-top: 16px;
}
.history-table-wrap {
  overflow: auto;
  margin-top: 12px;
}
.history-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}
.history-table th,
.history-table td {
  padding: 12px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  text-align: left;
}
.history-table td {
  color: #edf2ff;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}
.status-good {
  background: rgba(96, 214, 165, 0.18);
  color: #8df0c7;
}
.status-bad {
  background: rgba(255, 106, 139, 0.16);
  color: #ff96ad;
}
.dashboard-fade-enter-active,
.dashboard-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.dashboard-fade-enter-from,
.dashboard-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 900px) {
  .dashboard-backdrop {
    padding: 8px;
  }

  .dashboard-panel {
    height: calc(100vh - 16px);
    border-radius: 18px;
    padding: 16px;
  }

  .dashboard-header {
    flex-direction: column;
  }

  .chart-meta {
    align-items: flex-start;
  }
}
</style>
