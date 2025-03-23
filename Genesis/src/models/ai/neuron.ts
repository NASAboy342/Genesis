export class Neuron {
  private weights: number[];
  private bias: number;

  constructor(inputSize: number) {
    this.weights = Array.from(
      { length: inputSize },
      () => Math.random() * 2 - 1
    );
    this.bias = Math.random() * 2 - 1;
  }

  private activation(x: number): number {
    // Hard Sigmoid activation function
    return Math.max(0, Math.min(1, (x + 1) / 2));
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
