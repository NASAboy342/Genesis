<template>
  <div class="positive-button data-button" @click="isDataDialogVisible = true">Data</div>
  <CustomDialog dialog-title="Datas" v-model="isDataDialogVisible">
    <div>Cell count: {{cellCount}}</div>
    <div>Plant cell count: {{plantCellCount}}</div>
    <div>omnivoreCellCount: {{omnivoreCellCount}}</div>
    <div>===================</div>
    <div>Best Cell info</div>
    <div>===================</div>
    <div>Id: {{ bestCellId }}</div>
    <div>Score: {{ bestCellScore }}</div>
    <div>Age: {{ bestCellAge }}</div>
    <div>Energy: {{ bestCellEnergy }}</div>
    <div>Color: {{ bestCellColor }}</div>
    <div>HighestScore: {{ highestScore }}</div>
    <div class="positive-button" @click="handleCopyBestCellNeuralNetworkAsJson">Copy neuralNetwork</div>
    <NeuralNetworkComponent :neural-network="bestCellNeurone" ></NeuralNetworkComponent>
  </customDialog>

  <CustomDialog dialog-title="Cell Info" v-model="isCellInfoDialogVisible">
  </CustomDialog>
  <div class="game-view" id="game-container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Phaser from "phaser";
import { Cell } from "@/models/cell";
import { CellTypeEnum } from "@/models/enums/cellTypeEnum";
import CustomDialog from "@/components/customDialog.vue";
import { InternalClock } from "@/models/internalClock";
import { NeuralNetwork, serializeNeuralNetwork } from "@/models/ai/neuralNetwork";
import NeuralNetworkComponent from "@/components/NeuralNetworkComponent.vue";
import { useRouter } from "vue-router";
import { Photon } from "@/models/photon";

const router = useRouter();
const cellCount = ref(0);
const plantCellCount = ref(0);
const omnivoreCellCount = ref(0);
const initNeuralNetworkInJsonString = ref<string>(router.currentRoute.value.query.neuralNetworkInJsonString as string || '');

const bestCellId = ref(0);
const bestCellScore = ref(0);
const bestCellAge = ref(0);
const bestCellEnergy = ref(0);
const bestCellColor = ref('');
const bestCellNeurone = ref<NeuralNetwork>(null);
const bestCellNeuroneAsJson = ref<string>('');
const highestScore = ref(0);
const highestScoreCellNeuralNetworkAsJson = ref<string>('');

const isDataDialogVisible = ref(false);
const isCellInfoDialogVisible = ref(false);

const handleCopyBestCellNeuralNetworkAsJson = () => {
  navigator.clipboard.writeText(highestScoreCellNeuralNetworkAsJson.value).then(() => {}, (err) => {
    console.error('Could not copy text: ', err);
  });
};

onMounted(() => {
  const view = document.querySelector("#game-container");
  const viewWidth = view.clientWidth;
  const viewHeight = view.clientHeight;
  
  let cells: Cell[] = [];
  let photons: Photon[] = [];
  let createdCellCount = 0;
  let gameClock: InternalClock = new InternalClock();

  let lastPlantSpawn: number = 0;
  let plantSpawnIntervult: number = 5;

  let lastBestCellCheck: number = 0;
  let bestCellCheckInterval: number = 4.9;

  let lastPhotonSpawn: number = 0;
  let photonSpawnInterval: number = 0.3;

  let lastPopulationCheck: number = 0;
  let populationCheckInterval: number = 5.1;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: viewWidth,
    height: viewHeight,
    parent: "game-container", // Ensures Phaser attaches to the correct div
    physics: {
     default: "arcade",
     arcade: {
      x: 0,
      y: 0,
      width: viewWidth,
      height: viewHeight,
     }
    },
    scene: {
      preload,
      create,
      update,
    },
  };

  const game = new Phaser.Game(config);

  function updateDisplayDate() {
    cellCount.value = cells.length;
    plantCellCount.value = cells.filter(cell => cell.cellType === CellTypeEnum.plant).length;
    omnivoreCellCount.value = cells.filter(cell => cell.cellType === CellTypeEnum.omnivore).length;

    if(gameClock.ageInSec - lastBestCellCheck > bestCellCheckInterval) {
      lastBestCellCheck = gameClock.ageInSec;
      bestCellId.value = cells.sort((a, b) => b.successPoints - a.successPoints)[0].id;
    }
    let bestCell = cells.find(cell => cell.id === bestCellId.value);
    if(bestCell) {
      bestCellScore.value = bestCell.successPoints;
      bestCellAge.value = bestCell.clock.ageInSec;
      bestCellEnergy.value = bestCell.radius;
      bestCellColor.value = bestCell.color.toString();
      bestCellNeurone.value = bestCell.neuronNetwork; 
      bestCellNeuroneAsJson.value = serializeNeuralNetwork(bestCell.neuronNetwork);
      if(bestCell.successPoints > highestScore.value){
        highestScore.value = bestCell.successPoints;
        highestScoreCellNeuralNetworkAsJson.value = serializeNeuralNetwork(bestCell.neuronNetwork);
      }
    }
  }

  function reloadData(scene: Phaser.Scene): void{
    cells = [];
    createPlants(scene);
    createCells(scene, true);
  }

  function createCells(scene: Phaser.Scene, isFirstTimeLoad: boolean = false) {
    if(isFirstTimeLoad) {
      for(var i=0;i<100;i++) {
        createdCellCount++;
        let newCell = new Cell(scene, viewWidth, viewHeight, createdCellCount, 0, 0, CellTypeEnum.omnivore, initNeuralNetworkInJsonString.value);
        cells.push(newCell);
      }
    }
    else {
      for(var i=0;i<100;i++) {
        createdCellCount++;
        let newCell = new Cell(scene, viewWidth, viewHeight, createdCellCount, 0, 0, CellTypeEnum.omnivore, highestScoreCellNeuralNetworkAsJson.value);
        newCell.successPoints = highestScore.value;
        cells.push(newCell);
      }
    }
  }

  function createPlants(scene: Phaser.Scene) {
    for(var i=0;i<50;i++) {
      createdCellCount++;
      cells.push(new Cell(scene, viewWidth, viewHeight, createdCellCount, 0, 0, CellTypeEnum.plant));
    }
  }

  function SetCellInfoDialogVisible(cell: Cell): any {
    isCellInfoDialogVisible.value = true;
  }

  function preload(this: Phaser.Scene) {}

  function create(this: Phaser.Scene) {
    reloadData(this);
  }

  function update(this: Phaser.Scene) {
    gameClock.aging();
    clearDeadCells();
    updateAllCells();
    updateAllPhotons();
    checkIfToSpawnPlant(this);
    checkIfToDeletePhoton();
    checkIfToSpawnPhoton(this);
    updateDisplayDate();
    doIfTimeToCheckPopulation(this)
  }

  function checkIfToSpawnPlant(scene: Phaser.Scene) {
    if(
        cells.filter(cell => cell.cellType === CellTypeEnum.plant).length < 200 
        && gameClock.ageInSec - lastPlantSpawn > plantSpawnIntervult
        && Phaser.Math.Between(0, 1) < 1
      ) {
      createdCellCount++;
      cells.push(new Cell(scene, viewWidth, viewHeight, createdCellCount, 0, 0, CellTypeEnum.plant));
      lastPlantSpawn = gameClock.ageInSec;
    }
  }

  function checkIfToSpawnPhoton(scene: Phaser.Scene) {
    if(photons.length < 100 && isTimeToSpawnPhoton()) {
      photons.push(new Photon(scene, viewWidth /2 , viewHeight / 2));
    }
  }

  function clearDeadCells() {
    cells = cells.filter(cell => cell.isAlive);
  }
  
  function updateAllCells() {
    for (const cell of cells) {
      cell.update(photons, [cells]);
    }
  }
  
  function isTimeToSpawnPhoton(): boolean {
    if (gameClock.ageInSec - lastPhotonSpawn > photonSpawnInterval) {
      lastPhotonSpawn = gameClock.ageInSec;
      return true;
    }
    return false;
  }

  function updateAllPhotons() {
    photons.forEach(photon => {
      photon.update([]);
    })
  }
  function checkIfToDeletePhoton() {
    photons = photons.filter(photon => photon.radius > 0);
  }
  function doIfTimeToCheckPopulation(scene: Phaser.Scene) {
    if(lastPopulationCheck + populationCheckInterval >= gameClock.ageInSec){
      lastPopulationCheck = gameClock.ageInSec;
      doIfPopulationIsTooLow(scene);
    }
  }
  function doIfPopulationIsTooLow(scene: Phaser.Scene) {
    let criticalLowPopulation = 10;
    let omnivoreCellCount = cells.filter(cell => cell.cellType === CellTypeEnum.omnivore).length;
    if(omnivoreCellCount <= criticalLowPopulation) {
      createCells(scene, false)
    }
  }
});


</script>

<style scoped>
.game-view {
  position: absolute;
  width: 100%;
  height: 100%;
}
.data-button{
  position: absolute;
  z-index: 1;
  top: 50px;
  left: 10px;
  padding: 5px 10px;
}
</style>


