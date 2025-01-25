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
import fs from "fs";
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
  private mainSchema: Map<string, any[]>;
  private currentlyShowSchema: Map<string, any[]>;
  private indexJump: number = 100;
  private currentForeignSchemaToSelect: string[] = [];
  private canInsertData: boolean = true;
  public static getInstance(browserWindow: BrowserWindow): MainManager {
    if (!MainManager.instance) {
      MainManager.instance = new MainManager(browserWindow);
    }
    return MainManager.instance;
  }

  private constructor(browserWindow: BrowserWindow) {
    this.persistencePath = path.join(__dirname, isDev() ? "../../" : "../");
    this.dataBase = DataBaseConnector.getInstance();
    this.tableBuilder = new TableBuilder();
    this.schemaBuilder = new SchemaBuilder(new SqlTextGenerator());
    this.excelExporter = new ExcelExporter();
    this.browserWindow = browserWindow;
    this.mainSchema = new Map();
    this.currentlyShowSchema = new Map();
  }

  setJumper(jump: number): void {
    this.indexJump = jump;
  }

  checkForDisk(): boolean {
    const filePath = path.join(this.persistencePath, "data.json");
    const filePath2 = path.join(this.persistencePath, "schema.json");
    const filePath3 = path.join(this.persistencePath, "shownSchema.json");
    if (!fs.existsSync(filePath2)) console.warn("schema.json is missing");
    if (!fs.existsSync(filePath3)) console.warn("shownSchema.json is missing");

    return fs.existsSync(filePath);
  }
  get dataBaseExist() {
    return this.dataBase.databaseExists();
  }

  public async insertJson(json: string): Promise<string> {
    try {
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

      for (const [key, _] of Object.entries(schemaResult.tableSchema)) {
        const schemaQuery = `PRAGMA table_info(${key})`;
        const schemaResult = await this.dataBase.sqlCommandWithReponse(
          schemaQuery
        );
        let schema: any[] = schemaResult.map((row: any) => row.name);
        this.mainSchema.set(key, schema);
      }

      this.currentlyShowSchema = new Map(this.mainSchema);

      const fromID = { startId: 0, endId: this.indexJump };
      const tableData = await this.getTableDataObject(fromID, "main_table");
      this.saveTableDataToDisk(tableData);
      this.saveSchemasToDiskWhenQuit();
      this.browserWindow.webContents.send("tableDataFromBackend", tableData);

      return "ok";
    } catch (error) {
      console.error("Error handling insertJson:", error);
      return "Invalid Json object please give valid json object";
    }
  }

  public async initTableData(from: From): Promise<void> {
    let schema: string[] = [];
    let table: (string | number)[][] = [];
    const { startIndex, endIndex } = from;
    if (this.checkForDisk()) {
      try {
        const data: TableData = await this.getDiskData();
        schema = data.schema;
        table = data.table.slice(startIndex, endIndex + 1);
      } catch (error) {
        console.error("Error reading data from disk:", error);
        return;
      }
    } else {
      const dataQuery = `SELECT * FROM main_table WHERE id BETWEEN ${startIndex} AND ${endIndex}`;
      const dataResult = await this.dataBase.sqlCommandWithReponse(dataQuery);
      schema = await this.getTableSchema("main_table");
      table = dataResult.map((row: string | number) => Object.values(row));
    }
    const tableData: TableData = { schema: schema, table: table };
    this.browserWindow.webContents.send("tableDataFromBackend", tableData);
  }

  public saveSchemasToDiskWhenQuit(): void {
    console.log("This is mainshcema", this.mainSchema);
    const schemaJson = JSON.stringify(Array.from(this.mainSchema));
    const shownSchemaJson = JSON.stringify(
      Array.from(this.currentlyShowSchema)
    );
    const schemaFilePath = path.resolve(this.persistencePath, "schema.json");
    const currentlyShow = path.resolve(
      this.persistencePath,
      "shownSchema.json"
    );
    try {
      fs.writeFileSync(schemaFilePath, schemaJson);
      fs.writeFileSync(currentlyShow, shownSchemaJson);
      console.log("Schema saved to disk successfully.");
    } catch (err) {
      console.error("Error writing schema to disk:", err);
    }
  }

  public async getTableDataObject(
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
    sqlCommand: any,
    inputSchema?: string[]
  ): Promise<string> {
    if (this.canInsertData) {
      try {
        let mainSchema: string[];
        if (inputSchema) {
          this.currentForeignSchemaToSelect = [];
          const addForeignTable: Set<string> = new Set();
          const newShowMap: Map<string, string[]> = new Map();
          mainSchema = inputSchema.filter((shownColumnNames) => {
            let isMainSchema = false;
            this.currentlyShowSchema
              .get("main_table")
              ?.forEach((columnName) => {
                if (columnName === shownColumnNames) {
                  isMainSchema = true;
                } else {
                  this.currentlyShowSchema.keys().forEach((key) => {
                    if (
                      this.currentlyShowSchema
                        .get(key)
                        ?.includes(shownColumnNames) &&
                      key !== "main_table"
                    ) {
                      if (newShowMap.has(key)) {
                        if (!newShowMap.get(key)?.includes(shownColumnNames))
                          newShowMap.get(key)?.push(shownColumnNames);
                      } else {
                        newShowMap.set(key, [shownColumnNames]);
                      }
                      addForeignTable.add(key);
                    }
                  });
                  this.currentForeignSchemaToSelect.push(shownColumnNames);
                }
              });
            return isMainSchema;
          });

          newShowMap.forEach((value, key) => {
            this.currentlyShowSchema.set(key, value);
          });
          const addForeignArray = Array.from(addForeignTable).join(", ");
          mainSchema = mainSchema.concat(addForeignArray);
          let finalCommand = `SELECT ${mainSchema} `;
          console.log("result", finalCommand);
          sqlCommand = finalCommand.concat(sqlCommand);
        } else {
          mainSchema = this.currentlyShowSchema.get("main_table")!;
        }
        let result = await this.dataBase.sqlCommandWithReponse(sqlCommand);
        const table = result.map((row: string | number) => Object.values(row));

        const tableData: TableData = { schema: mainSchema, table: table };
        this.saveTableDataToDisk(tableData);

        const maxValue =
          table.length >= this.indexJump ? this.indexJump : table.length;

        const partialTableData = {
          schema: mainSchema,
          table: table.slice(0, maxValue),
        };
        this.browserWindow.webContents.send(
          "tableDataFromBackend",
          partialTableData,
          true
        );

        return "ok";
      } catch (error) {
        console.error("Error executing SQL command:", error);
        return "An error occurred while executing the SQL command";
      }
    } else {
      return "Please wait while data is being process please try again later";
    }
  }

  public saveTableDataToDisk(tableData: TableData) {
    this.canInsertData = false;
    const worker = new Worker(path.resolve(__dirname, "./SaveWorker.js"));
    worker.postMessage({
      filePath: path.resolve(this.persistencePath, "data.json"),
      content: tableData,
    });

    worker.on("message", (message) => {
      if (message.status === "success") {
        console.log("Data saved successfully");
      } else {
        console.error("Error saving data:", message.error);
      }
      this.canInsertData = true;
    });

    worker.on("error", (error) => {
      console.error("Worker error:", error);
      this.canInsertData = true;
    });
  }

  public async getTableSchema(tableName: string): Promise<string[]> {
    let schema: string[];
    if (this.currentlyShowSchema.get(tableName)) {
      console.log("currentlyShowSchema: ", this.currentlyShowSchema);
      schema = this.currentlyShowSchema.get(tableName)!;
    } else {
      const schemaQuery = `PRAGMA table_info(${tableName})`;
      const schemaResult = await this.dataBase.sqlCommandWithReponse(
        schemaQuery
      );
      schema = schemaResult.map((row: any) => row.name);
    }
    console.log("Schema: ", schema);
    return schema;
  }

  public async checkForTable(tableName: string): Promise<boolean> {
    const query = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
    const result = await this.dataBase.sqlCommandWithReponse(query);
    return result.length > 0;
  }

  public async exportToExcel() {
    const mainTable = this.getDiskData();
    if (mainTable) {
      const fullTable: TableData = await this.getFullTable(mainTable);
      const filePath = `${this.persistencePath}excelData.xlsx`;

      await this.excelExporter.exportResultToExcel(fullTable, filePath);
    } else {
      console.error("No data available to export");
    }
  }

  private async getFullTable(mainTable: TableData): Promise<TableData> {
    const resultTable: (string | number)[][] = mainTable.table;
    const resultSchema: string[] = mainTable.schema;
    const addSchema: Set<string> = new Set();
    for (let i = 0; i < mainTable.table.length; i++) {
      for (let j = 1; j < mainTable.table[i].length; j++) {
        if (typeof mainTable.table[i][j] === "number") {
          if (mainTable.schema[j]) {
            resultTable.splice(i, 0);
            resultTable[i].push(
              ...(await this.getRow(
                mainTable.table[i][j] as number,
                mainTable.schema[j]
              ))
            );
            if (!addSchema.has(mainTable.schema[j])) {
              addSchema.add(mainTable.schema[j]);
            }
          }
        }
      }
    }

    for (const schema of addSchema) {
      if (schema) {
        try {
          const schemaResult = await this.getTableSchema(schema);
          resultSchema.push(...schemaResult);
        } catch (error) {
          console.error(`Error fetching schema for table ${schema}:`, error);
        }
      }
    }

    return { schema: resultSchema, table: resultTable };
  }

  public getDiskData(): TableData {
    const data = JSON.parse(
      fs.readFileSync(path.resolve(this.persistencePath, "data.json"), "utf-8")
    );
    const shownSchemaData = JSON.parse(
      fs.readFileSync(
        path.resolve(this.persistencePath, "shownSchema.json"),
        "utf-8"
      )
    );
    this.currentlyShowSchema = new Map(Object.entries(shownSchemaData));

    const mainSchemaData = JSON.parse(
      fs.readFileSync(
        path.resolve(this.persistencePath, "schema.json"),
        "utf-8"
      )
    );
    this.mainSchema = new Map(Object.entries(mainSchemaData));
    return data;
  }

  public async amountOfRows(tableName: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const result = await this.dataBase.sqlCommandWithReponse(query);
    return result[0].count;
  }

  // Here for foreigntable you can save the scheam main_table: (Id, Name,...) , termine (Id, Name,...) and then when they delete
  //it just remove it form here
  //So instead of * get the schema text you save from the user this si a better way of doing the delete column then and save the name changes thsi will have to
  // be done in the database change it in the text array and the in the database
  async getRow(id: number, tableName: string): Promise<(string | number)[]> {
    let schema: string[] = [];
    if (this.currentForeignSchemaToSelect.length !== 0) {
      // Getting the value of the schema we are showing that are to the corresponding table
      schema = this.currentForeignSchemaToSelect.filter((activeColumn) => {
        if (this.currentlyShowSchema.get(tableName)?.includes(activeColumn))
          return true;
        else return false;
      });
    }

    const finale = schema.length <= 1 ? "*" : schema.join(" ,");
    const result = await this.dataBase.sqlCommandWithReponse(
      `SELECT ${finale} FROM ${tableName} WHERE id = ${id}`
    );

    if (result.length === 0) {
      throw new Error(`No row found with id ${id} in table ${tableName}`);
    }
    return Object.values(result[0]);
  }

  async cleanDatabase(): Promise<void> {
    try {
      await this.dataBase.recreateDatabase();
      this.tableBuilder = new TableBuilder();
      this.schemaBuilder = new SchemaBuilder(new SqlTextGenerator());
      this.excelExporter = new ExcelExporter();
      this.mainSchema = new Map();

      const file1Path = path.resolve(this.persistencePath, "data.json");
      const file2Path = path.resolve(this.persistencePath, "schema.json");
      const file3Path = path.resolve(this.persistencePath, "shownSchema.json");

      if (fs.existsSync(file1Path)) {
        fs.unlinkSync(file1Path);
        console.log(`Deleted file: ${file1Path}`);
      } else {
        console.warn(`File not found: ${file1Path}`);
      }

      if (fs.existsSync(file2Path)) {
        fs.unlinkSync(file2Path);
        console.log(`Deleted file: ${file2Path}`);
      } else {
        console.warn(`File not found: ${file2Path}`);
      }

      if (fs.existsSync(file3Path)) {
        fs.unlinkSync(file3Path);
        console.log(`Deleted file: ${file3Path}`);
      } else {
        console.warn(`File not found: ${file3Path}`);
      }
      console.log("Database file deleted successfully.");
    } catch (error) {
      console.error("Error deleting the database file:", error);
      throw new Error("Failed to delete the database file.");
    }
  } // Constraint has to be added to not call the column by the same name
  async renameColumn(
    commandStack: string,
    newColumnName: string,
    oldColumnName: string
  ): Promise<void> {
    let tableName: string | undefined;
    for (const key of this.mainSchema.keys()) {
      if (this.mainSchema.get(key)?.includes(oldColumnName)) {
        tableName = key;

        break;
      }
    }

    if (!tableName) {
      console.log("mainSchema", this.mainSchema);
      throw new Error(`Column ${oldColumnName} not found in any table.`);
    }

    const updateQuery = `ALTER TABLE ${tableName} RENAME COLUMN ${oldColumnName} TO ${newColumnName};`;
    await this.dataBase.sqlCommand([updateQuery]);

    for (const key of this.mainSchema.keys()) {
      const columns = this.mainSchema.get(key);
      if (columns?.includes(oldColumnName)) {
        const columnIndex = columns.indexOf(oldColumnName);
        if (columnIndex !== -1) {
          columns[columnIndex] = newColumnName;
        }
      }
    }

    for (const key of this.currentlyShowSchema.keys()) {
      const columns = this.currentlyShowSchema.get(key);
      if (columns?.includes(oldColumnName)) {
        const columnIndex = columns.indexOf(oldColumnName);
        if (columnIndex !== -1) {
          columns[columnIndex] = newColumnName;
        }
      }
    }

    const foreignSchemaIndex =
      this.currentForeignSchemaToSelect.indexOf(oldColumnName);
    if (foreignSchemaIndex !== -1) {
      this.currentForeignSchemaToSelect[foreignSchemaIndex] = newColumnName;
    }

    await this.uiSqlCommand(commandStack);
  }

  async removeColumn(commandStack: string, columnName: string): Promise<void> {}

  async getAllValues(columnName: string): Promise<String[]> {
    try {
      const tableName = this.mainSchema.get(columnName);
      if (!tableName) {
        throw new Error(`Table for column ${columnName} not found in schema.`);
      }

      const query = `SELECT ${columnName} FROM ${tableName};`;
      const result = await this.dataBase.sqlCommandWithReponse(query);

      return result.map((row: any) => row[columnName]);
    } catch (error) {
      console.error(
        `Error getting all values for column ${columnName}:`,
        error
      );
      throw new Error(`Failed to get all values for column ${columnName}`);
    }
  }
}

export default MainManager;
