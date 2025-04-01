import { NeuronActivationTypeEnum } from "../enums/neuronActivationTypeEnum";

export class Neuron {
  public weights: number[];
  public bias: number;
  public activationType: NeuronActivationTypeEnum;

  constructor(inputSize: number = 0) {
    this.weights = Array.from(
      { length: inputSize },
      () => Math.random() * 2 - 1
    );
    this.bias = Math.random() * 2 - 1;
    this.activationType = NeuronActivationTypeEnum.Sigmoid;
  }

  private activation(x: number): number {
    switch (this.activationType) {
      case NeuronActivationTypeEnum.HardSigmoid:
        return Math.max(0, Math.min(1, (x + 1) / 2));
      case NeuronActivationTypeEnum.Tanh:
        return Math.tanh(x);
      case NeuronActivationTypeEnum.ReLU:
        return Math.max(0, x);
      case NeuronActivationTypeEnum.LeakyReLU:
        return Math.max(0.01 * x, x);
      case NeuronActivationTypeEnum.Sigmoid:
        return 1 / (1 + Math.exp(-x));
    }
  }


  public compute(inputs: number[]): number {
    if (inputs.length !== this.weights.length) {
      throw new Error("Input size must match weight size.");
    }

    // Weighted sum + bias
    let sum =
      inputs.reduce((acc, input, i) => acc + input * this.weights[i], 0) +
      this.bias;

    // Apply activation function
    return this.activation(sum);
  }

  // Apply mutation by randomly changing weights and bias
  public mutate(mutationRate: number): void {
    for (let i = 0; i < this.weights.length; i++) {
      if (Math.random() < mutationRate) {
        this.weights[i] += (Math.random() * 2 - 1) * 0.1; // Slight change to weight
      }
    }
    if (Math.random() < mutationRate) {
      this.bias += (Math.random() * 2 - 1) * 0.1; // Slight change to bias
    }
  }
}
