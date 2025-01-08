import DataBaseConnector from "./DataBaseConnector.js";
import ExcelExporter from "./ExcelExporter.js";
import JsonObject from "./Interfaces/JsonObject.js";
import DataCleaner from "./Utils/DataCleaner.js";
import TableSchema from "./Interfaces/TableSchema.js";
import SchemaBuilder from "./SchemaBuilder.js";
import TableBuilder from "./TableBuilder.js";
import SqlTextGenerator from "./SqlTextGenerator.js";
import { BrowserWindow } from "electron";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import path from "path";
import { isDev } from "../util.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MainManager {
  private browserWindow: BrowserWindow;
  private static instance: MainManager;
  private dataBase: DataBaseConnector;
  private excelExporter: ExcelExporter;
  private schemaBuilder: SchemaBuilder;
  private tableBuilder: TableBuilder;
  private readonly persistencePath: string;
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
    this.excelExporter = new ExcelExporter();
    this.browserWindow = browserWindow;
    this.persistencePath = path.join(
      __dirname,
      isDev() ? "../../" : "../",
      "data.json"
    );
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
    const mainInsert: any[] = await this.tableBuilder.build(
      jsonObject,
      schemaResult.tableSchema
    );
    await this.dataBase.sqlCommand(mainInsert);

    const fromID = { startId: 0, endId: 100 };
    const tableData = await this.getNestedTableData(fromID, "main_table");
    this.browserWindow.webContents.send("tableDataFromBackend", tableData);
  }

  public async getTableData(fromID: FromId, tableName: string): Promise<void> {
    const { startId, endId } = fromID;
    const dataQuery = `SELECT * FROM ${tableName} WHERE id BETWEEN ${startId} AND ${endId}`;
    const dataResult = await this.dataBase.sqlCommandWithReponse(dataQuery);
    const schema = await this.getTableSchema(tableName);
    const table = dataResult.map((row: string | number) => Object.values(row));
    const tableData: TableData = { schema: schema, table: table };
    this.browserWindow.webContents.send("tableDataFromBackend", tableData);
  }

  public async getNestedTableData(
    fromID: FromId,
    tableName: string
  ): Promise<TableData> {
    const { startId, endId } = fromID;
    const dataQuery = `SELECT * FROM ${tableName} WHERE id BETWEEN ${startId} AND ${endId}`;
    const dataResult = await this.dataBase.sqlCommandWithReponse(dataQuery);
    const schema = await this.getTableSchema(tableName);
    const table = dataResult.map((row: string | number) => Object.values(row));

    return { schema: schema, table: table };
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

  public async uiSqlCommand(
    sqlCommand: string,
    tableName: string
  ): Promise<void> {
    let result = await this.dataBase.sqlCommandWithReponse(sqlCommand);
    const table = result.map((row: string | number) => Object.values(row));
    const schema = await this.getTableSchema(tableName);
    const tableData = { schema: schema, table: table };
    console.log("I was called");
    const worker = new Worker(
      path.resolve(__dirname, "./workers/SaveWorker.js")
    );
    worker.postMessage({
      filePath: this.persistencePath,
      content: tableData,
    });
    console.log("Saving data to disk using worker thread...");
    worker.on("message", (message) => {
      if (message.status === "success") {
        console.log("Data saved successfully");
      } else {
        console.error("Error saving data:", message.error);
      }
    });

    const partialTableData = { schema: schema, table: table.slice(0, 100) };
    this.browserWindow.webContents.send(
      "tableDataFromBackend",
      partialTableData
    );
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

  async getRow(id: number, tableName: string): Promise<(string | number)[]> {
    const result = await this.dataBase.sqlCommandWithReponse(
      `SELECT * FROM ${tableName} WHERE id = ${id}`
    );

    if (result.length === 0) {
      throw new Error(`No row found with id ${id} in table ${tableName}`);
    }
    return Object.values(result[0]);
  }
}

export default MainManager;
