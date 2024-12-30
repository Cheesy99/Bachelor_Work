import { parentPort } from "worker_threads";
import SqlTextGenerator from "../SqlTextGenerator.js";
import DataCleaner from "../Utils/DataCleaner.js";
import JsonObject from "../Interfaces/JsonObject.js";
import SchemaBuilder from "../SchemaBuilder.js";

class Worker {
  constructor() {
    parentPort?.on("message", this.handleMessage.bind(this));
  }

  private handleMessage(fileData: string) {
    try {
      const cleanedJson = fileData.replace(/"([^"]+)":/g, (_, p1) => {
        const cleanedKey = DataCleaner.cleanName(p1);
        return `"${cleanedKey}":`;
      });

      const jsonObject: JsonObject[] = JSON.parse(cleanedJson);
      const schemaBuilder = new SchemaBuilder();
      const sqlCommand = schemaBuilder.build(jsonObject);

      parentPort?.postMessage({ sqlCommand });
    } catch (error) {
      if (error instanceof Error) {
        parentPort?.postMessage({ error: error.message });
      } else {
        parentPort?.postMessage({ error: "An unknown error occurred" });
      }
    }
  }
}

// Instantiate the worker class to start listening for messages
new Worker();
