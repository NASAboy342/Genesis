export enum NeuronActivationTypeEnum {
    HardSigmoid = 0,
    /**
     * Sigmoid activation function. Returns linear output for inputs in the range [0..., ...1].
     * @see https://en.wikipedia.org/wiki/Sigmoid_function
     */
    Sigmoid = 1,
    Tanh = 2,
    ReLU = 3,
    LeakyReLU = 4,
    Softmax = 5
}