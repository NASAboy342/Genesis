<template>
  <div class="game-view" id="game-container"></div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import Phaser from "phaser";
import { Cell } from "@/models/cell";
import { CellTypeEnum } from "@/models/enums/cellTypeEnum";

onMounted(() => {
  const view = document.querySelector("#game-container");
  const viewWidth = view.clientWidth;
  const viewHeight = view.clientHeight;

  let cells: Cell[] = [];
  let createdCellCount = 0;

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

  function preload(this: Phaser.Scene) {}

  function create(this: Phaser.Scene) {
    for(var i = 0; i < 50; i++) {
      createdCellCount++;
      cells.push(new Cell(this, viewWidth, viewHeight, createdCellCount, 0, 0, CellTypeEnum.plant));
    }
    for(var i = 0; i < 100; i++) {
      createdCellCount++;
      cells.push(new Cell(this, viewWidth, viewHeight, createdCellCount));
    }
  }

  function update(this: Phaser.Scene) {
    clearDeadCells();
    for (const cell of cells) {
      cell.update([cells]);
      this.physics.world.wrap(cell);
    }

    if(cells.filter(cell => cell.cellType === CellTypeEnum.plant).length < 50) {
      createdCellCount++;
      cells.push(new Cell(this, viewWidth, viewHeight, createdCellCount, 0, 0, CellTypeEnum.plant));
    }
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
</style>


