import { Rocket } from "./gameObjects/rocket";

export class TrainingRecord {
  cycleNumber: number | undefined;
  highestScore: number | undefined;
  highestScoreRecord: number | undefined;
  bestNeuralNetworkJson: string | undefined;
  highestScoreRocket: Rocket | undefined;
  LostScore: number | undefined;
}