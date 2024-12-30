import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import JsonObject from "../Interfaces/JsonObject.js";
import TableSchema from "../Interfaces/TableSchema.js";

interface ExtendedWorker extends Worker {
  callback?: (error: Error | null, result?: any) => void;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkerPool {
  private workers: ExtendedWorker[] = [];
  private tasks: any[] = [];
  private maxWorkers: number;

  constructor(maxWorkers: number) {
    this.maxWorkers = maxWorkers;
  }

  private createWorker() {
    const worker: ExtendedWorker = new Worker(
      path.resolve(__dirname, "Worker.js")
    ) as ExtendedWorker;
    worker.on("message", (result) => {
      const callback = worker.callback;
      if (callback) {
        if (result.error) {
          callback(new Error(result.error));
        } else {
          callback(null, result);
        }
      }
      this.runNextTask(worker);
    });

    worker.on("error", (error) => {
      const callback = worker.callback;
      if (callback) {
        callback(error);
      }
      this.runNextTask(worker);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
    });

    this.workers.push(worker);
  }

  private runNextTask(worker: ExtendedWorker) {
    if (this.tasks.length > 0) {
      const { task, callback } = this.tasks.shift();
      worker.callback = callback;
      worker.postMessage(task);
    } else {
      worker.callback = undefined;
    }
  }

  private runTask(
    json: string,
    callback: (error: Error | null, result?: any) => void
  ) {
    const availableWorker = this.workers.find((worker) => !worker.callback);
    if (availableWorker) {
      availableWorker.callback = callback;
      availableWorker.postMessage(json);
    } else if (this.workers.length < this.maxWorkers) {
      this.createWorker();
      this.runTask(json, callback);
    } else {
      this.tasks.push({ json, callback });
    }
  }

  public chunkAndRunTask(
    jsonObject: JsonObject[],
    callback: (error: Error | null, result?: TableSchema) => void
  ) {
    const chunkSize = Math.ceil(jsonObject.length / this.maxWorkers);
    const chunks = this.chunkArray(jsonObject, chunkSize);

    for (const chunk of chunks) {
      const chunkJson = JSON.stringify(chunk);
      this.runTask(chunkJson, callback);
    }
  }

  private chunkArray(
    jsonObject: JsonObject[],
    chunkSize: number
  ): JsonObject[][] {
    const chunks: JsonObject[][] = [];
    for (let i = 0; i < jsonObject.length; i += chunkSize) {
      chunks.push(jsonObject.slice(i, i + chunkSize));
    }
    return chunks;
  }

  get maxWorker(): number {
    return this.maxWorkers;
  }
}

export default WorkerPool;
