import { parentPort } from "worker_threads";
import DataCleaner from "../Utils/DataCleaner.js";
import JsonObject from "../Interfaces/JsonObject.js";
import SchemaBuilder from "../SchemaBuilder.js";
import { Parcel, Task, Type } from "./Interfaces.js";
import TableSchema from "../Interfaces/TableSchema.js";
import TableBuilder from "../TableBuilder.js";
import TableDataBackend from "../Interfaces/TableData.js";

class Worker {
  private schemaBuilder: SchemaBuilder;
  private tableBuilder: TableBuilder;
  constructor() {
    parentPort?.on("message", this.handleMessage.bind(this));
    this.schemaBuilder = new SchemaBuilder();
    this.tableBuilder = new TableBuilder();
  }

  private handleMessage(task: Task) {
    try {
      if (task.type === Type.schema) {
        const result: Parcel = this.handleSchemaTask(task.payload as string);
        parentPort?.postMessage(result);
      } else if (task.type === Type.table) {
        const result: Parcel = this.handleTableTask(
          task.payload as { payload: string; schema: TableSchema }
        );
        parentPort?.postMessage(result);
      }
    } catch (error) {
      if (error instanceof Error) {
        parentPort?.postMessage({ error: error.message });
      } else {
        parentPort?.postMessage({ error: "An unknown error occurred" });
      }
    } finally {
      // Clear memory after task completion
      this.clearMemory();
    }
  }

  private handleSchemaTask(payload: string): Parcel {
    const cleanedJson = payload.replace(/"([^"]+)":/g, (_, p1) => {
      const cleanedKey = DataCleaner.cleanName(p1);
      return `"${cleanedKey}":`;
    });

    const jsonObject: JsonObject[] = JSON.parse(cleanedJson);
    const schema: TableSchema = this.schemaBuilder.build(jsonObject);

    const result: Parcel = { type: Type.schema, payload: schema };
    return result;
  }

  private handleTableTask(payload: {
    payload: string;
    schema: TableSchema;
  }): Parcel {
    const cleanedJson = payload.payload.replace(/"([^"]+)":/g, (_, p1) => {
      const cleanedKey = DataCleaner.cleanName(p1);
      return `"${cleanedKey}":`;
    });

    const jsonObject: JsonObject[] = JSON.parse(cleanedJson);
    const tableSchema = payload.schema;
    const command: TableDataBackend[] = this.tableBuilder.build(
      jsonObject,
      tableSchema
    );
    const result: Parcel = {
      type: Type.table,
      payload: command,
    };
    return result;
  }

  private clearMemory() {
    this.tableBuilder = new TableBuilder();
  }
}

new Worker();
