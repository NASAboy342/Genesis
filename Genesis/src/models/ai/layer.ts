import { Neuron } from "./neuron";

export class Layer {
    public neurons: Neuron[];
  
    constructor(inputSize: number = 0, neuronCount: number = 0) {
      this.neurons = Array.from({ length: neuronCount }, () => new Neuron(inputSize));
    }
  
    public compute(inputs: number[]): number[] {
      // Compute output of all neurons in the layer
      return this.neurons.map(neuron => neuron.compute(inputs));
    }

    public mutate(mutationRate: number): void {
        for (let neuron of this.neurons) {
          neuron.mutate(mutationRate);
        } 
    }
  }