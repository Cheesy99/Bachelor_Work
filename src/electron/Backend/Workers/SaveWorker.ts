import { parentPort } from "worker_threads";
import fs from "fs";

class SaveWorker {
  constructor() {
    parentPort?.on("message", this.handleMessage.bind(this));
  }

  private handleMessage(task: { filePath: string; content: TableData }) {
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
export default SaveWorker;
