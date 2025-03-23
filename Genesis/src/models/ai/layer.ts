import { Neuron } from "./neuron";

export class Layer {
    private neurons: Neuron[];
  
    constructor(inputSize: number, neuronCount: number) {
      // Create neurons for the layer
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