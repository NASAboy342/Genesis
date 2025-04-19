import { Layer } from "./layer";
import { Neuron } from "./neuron";

export class NeuralNetwork {
    public layers: Layer[];
  
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

  export function serializeNeuralNetwork(network: NeuralNetwork): string {
    return JSON.stringify(network, (key, value) => {
        if (value instanceof Layer) {
            return { __type: "Layer", neurons: value.neurons };
        }
        if (value instanceof Neuron) {
            return { 
                __type: "Neuron", 
                weights: value.weights, 
                bias: value.bias, 
                activationType: value.activationType 
            };
        }
        return value;
    });
}

export function deserializeNeuralNetwork(json: string): NeuralNetwork {
    const obj = JSON.parse(json, (key, value) => {
        if (value && value.__type === "Layer") {
            const layer = new Layer();
            layer.neurons = value.neurons.map((n: any) => new Neuron(n.weights.length));
            layer.neurons.forEach((neuron, i) => {
                neuron.weights = value.neurons[i].weights;
                neuron.bias = value.neurons[i].bias;
                neuron.activationType = value.neurons[i].activationType;
            });
            return layer;
        }
        if (value && value.__type === "Neuron") {
            const neuron = new Neuron(value.weights.length);
            neuron.weights = value.weights;
            neuron.bias = value.bias;
            neuron.activationType = value.activationType;
            return neuron;
        }
        return value;
    });

    const network = new NeuralNetwork([]);
    network.layers = obj.layers;
    return network;
}

export class SimpleNeuralNetwork {
  public layers: [
    {
      neurons: [
        {
          weights: number[];
          bias: number;
        }
      ];
    }
  ]
}