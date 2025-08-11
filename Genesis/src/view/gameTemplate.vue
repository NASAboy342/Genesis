<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import Phaser from "phaser";

class GameScene extends Phaser.Scene {
  
    constructor() {
      super({ key: "GameScene" });
    }
  
    preload() {
    }
  
    create() {
    }
  
    update() {
    }
  }
  
  let game: Phaser.Game | null = null;
  
  onMounted(() => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 1000,
      height: 600,
      parent: "game-container",
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