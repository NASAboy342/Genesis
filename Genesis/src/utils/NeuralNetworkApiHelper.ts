export class DataBaseApiHelper {
  static async saveRawData(neuralNetworkJson: string): Promise<any> {
    try {
      const response = await fetch("https://n8n.1681686666.com/webhook/insert-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: neuralNetworkJson
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return await response.json();
    } catch (error) {
      console.error("Error sending neural network data:", error);
      throw error;
    }
  }
}
