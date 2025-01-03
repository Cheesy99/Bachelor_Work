import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import JsonObject from "../Interfaces/JsonObject.js";
import TableSchema from "../Interfaces/TableSchema.js";
import { EventEmitter } from "events";
import { Task, Parcel, Type } from "./Interfaces.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
interface ExtendedWorker extends Worker {
  callback?: (error: Error | null, result?: Parcel) => void;
}
class WorkerPool extends EventEmitter {
  private workers: ExtendedWorker[] = [];
  private tasks: {
    task: Task;
    callback: (error: Error | null, result?: Parcel) => void;
  }[] = [];
  private maxWorkers: number;
  constructor(maxWorkers: number) {
    super();
    this.maxWorkers = maxWorkers;
    for (let i = 0; i < maxWorkers; i++) {
      this.createWorker();
    }
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
      const { task, callback } = this.tasks.shift()!;
      worker.callback = callback;
      worker.postMessage(task);
    } else {
      worker.callback = undefined;
      if (this.workers.every((worker) => !worker.callback)) {
        this.emit("allTasksCompleted");
      }
    }
  }

  private runTask(
    task: Task,
    callback: (error: Error | null, result?: Parcel) => void
  ) {
    const availableWorker = this.workers.find((worker) => !worker.callback);
    if (availableWorker) {
      availableWorker.callback = callback;
      availableWorker.postMessage(task);
    } else if (this.workers.length < this.maxWorkers) {
      this.createWorker();
      this.runTask(task, callback);
    } else {
      this.tasks.push({ task, callback });
    }
  }

  public createSchema(
    jsonObject: JsonObject[],
    callback: (error: Error | null, result?: Parcel) => void
  ): void {
    const chunkSize = Math.ceil(jsonObject.length / this.maxWorkers);
    const chunks = this.chunkArray(jsonObject, chunkSize);

    for (const chunk of chunks) {
      const chunkJson = JSON.stringify(chunk);
      const schemaTask: Task = {
        type: Type.schema,
        payload: chunkJson,
      };
      this.runTask(schemaTask, callback);
    }
  }

  public createTable(
    jsonObject: JsonObject[],
    schema: TableSchema,
    callback: (error: Error | null, result?: Parcel) => void,
    desiredChunkSize: number = 100
  ): void {
    const chunkSize = Math.min(
      desiredChunkSize,
      Math.ceil(jsonObject.length / this.maxWorkers)
    );
    console.log("chunk size", chunkSize);
    console.log("jsonsize", jsonObject.length);
    const chunks = this.chunkArray(jsonObject, chunkSize);

    for (const chunk of chunks) {
      const chunkJson = JSON.stringify(chunk);
      const pay: { payload: string; schema: TableSchema } = {
        payload: chunkJson,
        schema: schema,
      };
      const schemaTask: Task = {
        type: Type.table,
        payload: pay,
      };
      this.runTask(schemaTask, callback);
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
