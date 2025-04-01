<template>
  <div class="positive-button data-button" @click="isDataDialogVisible = true">Data</div>
  <CustomDialog dialog-title="Datas" v-model="isDataDialogVisible">
    <div>Cell count: {{cellCount}}</div>
    <div>Plant cell count: {{plantCellCount}}</div>
    <div>omnivoreCellCount: {{omnivoreCellCount}}</div>
  </customDialog>
  <div class="game-view" id="game-container"></div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Phaser from "phaser";
import { Cell } from "@/models/cell";
import { CellTypeEnum } from "@/models/enums/cellTypeEnum";
import CustomDialog from "@/components/customDialog.vue";
import { InternalClock } from "@/models/internalClock";

const cellCount = ref(0);
const plantCellCount = ref(0);
const omnivoreCellCount = ref(0);

const isDataDialogVisible = ref(false);

onMounted(() => {
  const view = document.querySelector("#game-container");
  const viewWidth = view.clientWidth;
  const viewHeight = view.clientHeight;
  
  let cells: Cell[] = [];
  let createdCellCount = 0;
  let gameClock: InternalClock = new InternalClock();
  let lastPlantSpawn: number = 0;
  let plantSpawnIntervult: number = 1;

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
  }

  function reloadData(scene: Phaser.Scene): void{
    cells = [];
    for(var i = 0; i < 50; i++) {
      createdCellCount++;
      cells.push(new Cell(scene, viewWidth, viewHeight, createdCellCount, 0, 0, CellTypeEnum.plant));
    }
    for(var i = 0; i < 100; i++) {
      createdCellCount++;
      cells.push(new Cell(scene, viewWidth, viewHeight, createdCellCount));
    }
  }

  function preload(this: Phaser.Scene) {}

  function create(this: Phaser.Scene) {
    reloadData(this);
  }

  function update(this: Phaser.Scene) {
    gameClock.aging();
    clearDeadCells();
    for (const cell of cells) {
      cell.update([cells]);
      this.physics.world.wrap(cell);
    }

    if(
        cells.filter(cell => cell.cellType === CellTypeEnum.plant).length < 300 
        && gameClock.ageInSec - lastPlantSpawn > plantSpawnIntervult
        && Phaser.Math.Between(0, 1) < 1
      ) {
      createdCellCount++;
      cells.push(new Cell(this, viewWidth, viewHeight, createdCellCount, 0, 0, CellTypeEnum.plant));
      lastPlantSpawn = gameClock.ageInSec;
    }

    updateDisplayDate();
  }

  function clearDeadCells() {
    cells = cells.filter(cell => cell.isAlive);
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
