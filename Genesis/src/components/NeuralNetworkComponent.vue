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
import { MathUtils } from "@/utils/mathUtils";

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
      let marginLeft = 30;
      let marginTop = 20;
      let layerGap = 260;
      let layerW = 30;
      let layerH = layer.neurons.length * 65;
      let layerY = 0 + marginTop;
      let layerX = marginLeft + index * (layerW + layerGap);

      this.add.graphics()
        .fillStyle(ColorUtils.rgbToHex(255,255,255), 0)
        .fillRect(layerX, layerY, layerW, layerH);

      layer.neurons.forEach((neuron, neuronIndex) => {
        let neuralR = 8;
        let neuralGap = 50;
        let neuralY = marginTop + 2 + (neuronIndex * (neuralR * 2 + neuralGap));
        let neuralCenteredX = layerX + (layerW / 2);
        let neuralCenteredY = neuralY + neuralR;

        this.add.graphics()
          .fillStyle(ColorUtils.rgbToHex(0, 200, 150), 1)
          .fillCircle(neuralCenteredX, neuralCenteredY, neuralR);

        if(index !== 0){
          neuron.weights.forEach((weight, weightIndex) => {
            let lineW = MathUtils.Mapto0and8(weight);
            let lineColor = ColorUtils.rgbToHex(0, 100, 100);
            let lineAlp = 1;
            let lineX1 = layerX - (layerW / 2) - layerGap;
            let lineY1 = marginTop + 8 + (weightIndex * (neuralR * 2 + neuralGap));
            let lineX2 = neuralCenteredX;
            let lineY2 = neuralCenteredY;
  
            this.add.graphics()
            .lineStyle(lineW, lineColor, lineAlp)
            .beginPath()
            .moveTo(lineX1, lineY1)
            .lineTo(lineX2, lineY2)
            .strokePath()
          });
        }
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
  width: 1000px;
  height: 1000px;
  background-color: blueviolet;
}
</style>
