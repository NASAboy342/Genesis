<template>
  <div class="svg-container">
    <div class="game-view" id="game-container"></div>
  </div>
</template>

<script setup lang="ts">
import { NeuralNetwork } from "@/models/ai/neuralNetwork";
import { ref, watch } from "vue";
import { onMounted } from "vue";
import Phaser from "phaser";
import { ColorUtils } from "@/utils/colorUtils";

const props = defineProps<{ neuralNetwork: NeuralNetwork}>();

onMounted(() => {
  const view = document.querySelector("#game-container");
  const viewWidth = view.clientWidth;
  const viewHeight = view.clientHeight;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: viewWidth,
    height: viewHeight,
    parent: "game-container",
    scene: {
      preload,
      create,
      update,
    },
  };

  const game = new Phaser.Game(config);

  function preload() {
  }

  function create(this: Phaser.Scene) {
    props.neuralNetwork.layers.forEach((layer, index) => {
      let layerX = 50 + index * 100;
      let layerY = 50;
      let layerW = 30;
      let layerH = layer.neurons.length * 20;

      this.add.graphics()
        .fillStyle(ColorUtils.rgbToHex(255,255,255), 1)
        .fillRect(layerX, layerY, layerW, layerH);

      layer.neurons.forEach((neuron, neuronIndex) => {
        let neuralR = 8;
        let neuralY = (50 + (neuralR / 4)) + neuronIndex * 20;
        let neuralCenteredX = layerX + neuralR;
        let neuralCenteredY = neuralY + neuralR;

        this.add.graphics()
          .fillStyle(ColorUtils.rgbToHex(0, 200, 150), 1)
          .fillCircle(neuralCenteredX, neuralCenteredY, neuralR)
      });
    });
  }

  function update(this: Phaser.Scene, time: number, delta: number) {
    // Game update logic here
  }
});


</script>

<style scoped>
.game-view {
  position: relative;
  width: 400px;
  height: 400px;
  background-color: blueviolet;
}
</style>
