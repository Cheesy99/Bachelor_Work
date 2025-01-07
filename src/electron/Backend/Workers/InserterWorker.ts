import { parentPort, workerData } from "worker_threads";
import TableBuilder from "../TableBuilder.js";
import JsonObject from "../Interfaces/JsonObject.js";
import TableSchema from "../Interfaces/TableSchema.js";

class InserterWorker {
  private tableBuilder: TableBuilder;
  constructor() {
    parentPort?.on("message", this.handleMessage.bind(this));
    this.tableBuilder = new TableBuilder();
    if (workerData) {
      this.handleMessage(workerData);
    }
  }

  private async handleMessage(message: {
    content: JsonObject[];
    tableSchema: TableSchema;
  }) {
    try {
      await this.tableBuilder.build(message.content, message.tableSchema);
      parentPort?.postMessage({ status: "success" });
    } catch (error) {
      parentPort?.postMessage({ status: "error", error: message });
    }
  }
}

new InserterWorker();
