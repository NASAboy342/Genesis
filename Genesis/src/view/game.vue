<template>
  <div class="game-view" id="game-container"></div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import Phaser from "phaser";
import { Cell } from "@/models/cell";

onMounted(() => {
  const view = document.querySelector("#game-container");
  const viewWidth = view.clientWidth;
  const viewHeight = view.clientHeight;

  let cells: Cell[] = [];

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
    for(var i = 0; i < 100; i++) {
      cells.push(new Cell(this, viewWidth, viewHeight, i));
    }
  }

  function update(this: Phaser.Scene) {
    for (const cell of cells) {
      cell.update([cells]);
      this.physics.world.wrap(cell);
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
</style>
