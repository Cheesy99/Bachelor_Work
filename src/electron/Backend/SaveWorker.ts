import { parentPort } from "worker_threads";
import fs from "fs";

class SaveWorker {
  constructor() {
    console.log("SaveWorker initialized");
    parentPort?.on("message", this.handleMessage.bind(this));
  }

  private handleMessage(task: { filePath: string; content: TableData }) {
    console.log("Received task:", task);
    const { filePath, content } = task;
    fs.writeFile(filePath, JSON.stringify(content), (err) => {
      if (err) {
        parentPort?.postMessage({ status: "error", error: err.message });
      } else {
        parentPort?.postMessage({ status: "success" });
      }
    });
  }
}
new SaveWorker();
