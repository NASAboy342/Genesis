import { Layer } from "./layer";

export class NeuralNetwork {
    private layers: Layer[];
  
    constructor(layerSizes: number[]) {
      this.layers = [];
      for (let i = 0; i < layerSizes.length - 1; i++) {
        // Create layers with neurons matching input and output sizes
        this.layers.push(new Layer(layerSizes[i], layerSizes[i + 1]));
      }
    }
  
    public feedForward(inputs: number[]): number[] {
      let currentOutput = inputs;
      for (let layer of this.layers) {
        currentOutput = layer.compute(currentOutput);
      }
      return currentOutput;
    }
    public mutate(mutationRate: number): void {
        for (let layer of this.layers) {
          layer.mutate(mutationRate);
        }
    }

  }