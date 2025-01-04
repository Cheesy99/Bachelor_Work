import DataBaseConnector from "./DataBaseConnector.js";
import ExcelExporter from "./ExcelExporter.js";
import JsonObject from "./Interfaces/JsonObject.js";
import DataCleaner from "./Utils/DataCleaner.js";
import WorkerPool from "./MultiThreading/WorkerPool.js";
import * as os from "os";
import TableSchema from "./Interfaces/TableSchema.js";
import TableDataBackend from "./Interfaces/TableData.js";
import SchemaBuilder from "./SchemaBuilder.js";
import TableBuilder from "./TableBuilder.js";
import SqlTextGenerator from "./SqlTextGenerator.js";
import fs from "fs";
import { BrowserWindow } from "electron";

class MainManager {
  private browserWindow: BrowserWindow;
  private static instance: MainManager;
  private dataBase: DataBaseConnector;
  private excelExporter: ExcelExporter;
  private workerPool: WorkerPool;
  private schemaBuilder: SchemaBuilder;
  private tableBuilder: TableBuilder;
  private listener?: (tableData: TableData) => void;
  private resolveAllTasks: (() => void) | null = null;
  public static getInstance(browserWindow: BrowserWindow): MainManager {
    if (!MainManager.instance) {
      MainManager.instance = new MainManager(browserWindow);
    }
    return MainManager.instance;
  }

  private constructor(browserWindow: BrowserWindow) {
    this.dataBase = DataBaseConnector.getInstance();
    this.tableBuilder = new TableBuilder();
    this.schemaBuilder = new SchemaBuilder(new SqlTextGenerator());
    this.tableBuilder = new TableBuilder();
    this.excelExporter = new ExcelExporter();
    this.browserWindow = browserWindow;
    const numCores = os.cpus().length;
    const numWorkers = Math.max(1, Math.floor(numCores / 2));
    this.workerPool = new WorkerPool(numWorkers);
    this.workerPool.on(
      "allTasksCompleted",
      this.handleAllTasksCompleted.bind(this)
    );
  }

  private notifyTableDataChange(tableData: TableData) {
    if (this.listener) {
      this.listener(tableData);
    }
  }

  setListener(callback: (tableData: TableData) => void): void {
    this.listener = callback;
  }

  get dataBaseExist() {
    return this.dataBase.databaseExists();
  }

  public async insertJson(json: string): Promise<void> {
    const cleanedJson = json.replace(/"([^"]+)":/g, (_, p1) => {
      const cleanedKey = DataCleaner.cleanName(p1);
      return `"${cleanedKey}":`;
    });

    const jsonObject: JsonObject[] = JSON.parse(cleanedJson);
    let schemaResult: {
      command: string[];
      tableSchema: TableSchema;
    } = this.schemaBuilder.generateSchemaWithCommand(jsonObject);
    await this.dataBase.sqlCommand(schemaResult.command);
    await this.tableBuilder.build(jsonObject, schemaResult.tableSchema);

    const fromID = { startId: 0, endId: 100 };
    const tableData = await this.getTableData(fromID, "main_table");
    this.browserWindow.webContents.send("tableDataFromBackend", tableData);
  }

  public async getTableData(
    fromID: FromId,
    tableName: string
  ): Promise<TableData> {
    const { startId, endId } = fromID;
    const dataQuery = `SELECT * FROM ${tableName} WHERE id BETWEEN ${startId} AND ${endId}`;
    const dataResult = await this.dataBase.sqlCommandWithReponse(dataQuery);
    const schema = await this.getTableSchema(tableName);
    const table = dataResult.map((row: string | number) => Object.values(row));
    return { schema, table };
  }

  public async getCurrentIndexRange(tableName: string): Promise<FromId> {
    const minIdQuery = `SELECT MIN(id) as minId FROM ${tableName}`;
    const maxIdQuery = `SELECT MAX(id) as maxId FROM ${tableName}`;
    const minIdResult = await this.dataBase.sqlCommandWithReponse(minIdQuery);
    const maxIdResult = await this.dataBase.sqlCommandWithReponse(maxIdQuery);
    const startId = minIdResult[0].minId;
    const endId = maxIdResult[0].maxId;
    return { startId, endId };
  }
  public async sqlCommand(sqlCommand: string): Promise<(string | number)[][]> {
    let result = await this.dataBase.sqlCommandWithReponse(sqlCommand);
    const table = result.map((row: string | number) => Object.values(row));
    return table;
  }

  public async getTableSchema(tableName: string): Promise<string[]> {
    const schemaQuery = `PRAGMA table_info(${tableName})`;
    const schemaResult = await this.dataBase.sqlCommandWithReponse(schemaQuery);
    const schema = schemaResult.map((row: any) => row.name);
    return schema;
  }

  public async checkForTable(tableName: string): Promise<boolean> {
    const query = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
    const result = await this.dataBase.sqlCommandWithReponse(query);
    return result.length > 0;
  }

  public async exportToExcel(result: TableData) {
    await this.excelExporter.exportResultToExcel(result);
  }

  getSavedResult(): Promise<TableData | boolean> {
    throw new Error("Method not implemented.");
  }
  saveResult(tableData: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public async amountOfRows(tableName: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const result = await this.dataBase.sqlCommandWithReponse(query);
    return result[0].count;
  }

  public async insertBig(json: string): Promise<void> {
    const cleanedJson = json.replace(/"([^"]+)":/g, (_, p1) => {
      const cleanedKey = DataCleaner.cleanName(p1);
      return `"${cleanedKey}":`;
    });

    const jsonObject: JsonObject[] = JSON.parse(cleanedJson);
    const tableSchemaCollector: TableSchema[] = [];
    let tableSchema: TableSchema;
    const tableDataCollector: TableDataBackend[][] = [];

    const schemaPromise = new Promise<void>((resolve, reject) => {
      this.resolveAllTasks = resolve;
      this.workerPool.createSchema(jsonObject, (error, result) => {
        if (error) {
          console.error("Worker error:", error);
          reject(error);
          return;
        }
        if (result) {
          const payload = result.payload as TableSchema;
          tableSchemaCollector.push(payload);
        }
      });
    });

    await schemaPromise;

    tableSchema = DataCleaner.mergeSchemas(tableSchemaCollector);
    let command = this.schemaBuilder.generateSchemaText(tableSchema);
    await this.dataBase.sqlCommand(DataCleaner.cleanSqlCommand(command));

    const tablePromise = new Promise<void>((resolve, reject) => {
      this.resolveAllTasks = resolve;

      this.workerPool.createTable(jsonObject, tableSchema!, (error, result) => {
        if (error) {
          console.error("Worker error:", error);
          reject(error);
          return;
        }
        if (result) {
          const payload = result.payload as TableDataBackend[];
          tableDataCollector.push(payload);
        }
      });
    });

    await tablePromise;
  }

  private handleAllTasksCompleted() {
    console.log("All tasks have been completed.");
    if (this.resolveAllTasks) {
      this.resolveAllTasks();
      this.resolveAllTasks = null;
    }
  }
}

export default MainManager;
