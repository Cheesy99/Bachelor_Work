import DataBaseConnector from "./DataBaseConnector.js";
import ExcelExporter from "./ExcelExporter.js";
import JsonObject from "./Interfaces/JsonObject.js";
import DataCleaner from "./Utils/DataCleaner.js";
import TableSchema from "./Interfaces/TableSchema.js";
import SchemaBuilder from "./SchemaBuilder.js";
import TableBuilder from "./TableBuilder.js";
import SqlTextGenerator from "./SqlTextGenerator.js";
import { BrowserWindow } from "electron";
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
  private currentForeignSchemaToSelect: string[] = [];
  private sqlCommand: string = "SELECT * FROM main_table LIMIT 100 OFFSET 0;";
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

  async saveSqlCommand(): Promise<void> {}

  checkForDisk(): boolean {
    let everthing: boolean = true;
    const filePath1 = path.join(this.persistencePath, "schema.json");
    const filePath2 = path.join(this.persistencePath, "shownSchema.json");
    const filePath3 = path.join(this.persistencePath, "sqlcommand.json");
    const filePath4 = path.join(this.persistencePath, "foreignColumn.json");

    if (!fs.existsSync(filePath1)) {
      console.warn("schema.json is missing");
      everthing = false;
    }
    if (!fs.existsSync(filePath2)) {
      console.warn("shownSchema.json is missing");
      everthing = false;
    }
    if (!fs.existsSync(filePath3)) {
      console.warn("sqlcommand.json is missing");
      everthing = false;
    }
    if (!fs.existsSync(filePath4)) {
      console.warn("sqlcommand.json is missing");
      everthing = false;
    }

    return everthing;
  }

  get dataBaseExist() {
    return this.dataBase.databaseExists();
  }

  public async insertJson(json: string): Promise<string> {
    try {
      const cleanedJsonString = json.replace(/\\"/g, "");
      const cleanedJson = cleanedJsonString.replace(/"([^"]+)":/g, (_, p1) => {
        const cleanedKey = DataCleaner.cleanName(p1);
        return `"${cleanedKey}":`;
      });

      const jsonObject: JsonObject[] = JSON.parse(cleanedJson);
      console.log("Checking: ", jsonObject[0]);
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

      const fromID = { startId: 0, endId: 100 };
      const tableData = await this.getTableDataObject(fromID, "main_table");
      this.saveToDiskWhenQuit();
      this.browserWindow.webContents.send("tableDataFromBackend", tableData);

      return "ok";
    } catch (error) {
      console.error("Error handling insertJson:", error);
      return "Invalid Json object please give valid json object";
    }
  }

  public async initTableData(): Promise<void> {
    let schema: string[] = [];
    let table: (string | number)[][] = [];

    if (this.checkForDisk()) {
      this.getDiskData();
      this.uiSqlCommand(this.sqlCommand);
    } else {
      const dataQuery = "SELECT * FROM main_table LIMIT 100 OFFSET 0;";
      const dataResult = await this.dataBase.sqlCommandWithReponse(dataQuery);
      schema = await this.getTableSchema("main_table");
      table = dataResult.map((row: string | number) => Object.values(row));

      const tableData: TableData = { schema: schema, table: table };
      this.browserWindow.webContents.send("tableDataFromBackend", tableData);
    }
  }

  public saveToDiskWhenQuit(): void {
    const schemaJson = JSON.stringify(Array.from(this.mainSchema));
    const shownSchemaJson = JSON.stringify(
      Array.from(this.currentlyShowSchema)
    );
    const shownForeignColumn = JSON.stringify(
      this.currentForeignSchemaToSelect
    );
    const schemaFilePath = path.resolve(this.persistencePath, "schema.json");
    const currentlyShow = path.resolve(
      this.persistencePath,
      "shownSchema.json"
    );
    const shownForeignColumnpath = path.resolve(
      this.persistencePath,
      "foreignColumn.json"
    );
    const sqlCommandFilePath = path.join(
      this.persistencePath,
      "sqlcommand.json"
    );
    let sqlCommandSave = this.sqlCommand;
    sqlCommandSave = sqlCommandSave.replace(/LIMIT\s+\d+/i, "LIMIT 100");
    sqlCommandSave = sqlCommandSave.replace(/OFFSET\s+\d+/i, "OFFSET 0");
    try {
      fs.writeFileSync(
        sqlCommandFilePath,
        JSON.stringify({ sqlCommand: sqlCommandSave })
      );
      fs.writeFileSync(schemaFilePath, schemaJson);
      fs.writeFileSync(currentlyShow, shownSchemaJson);
      fs.writeFileSync(shownForeignColumnpath, shownForeignColumn);
      console.info("Schema saved to disk successfully.");
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
    try {
      let mainSchema: string[];

      this.currentForeignSchemaToSelect = [];
      const addForeignTable: Set<string> = new Set();
      const newShowMap: Map<string, string[]> = new Map();
      if (inputSchema) {
        mainSchema = inputSchema.filter((shownColumnNames) => {
          let isMainSchema = false;
          this.currentlyShowSchema.get("main_table")?.forEach((columnName) => {
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
        sqlCommand = finalCommand.concat(sqlCommand);
      } else {
        mainSchema = this.currentlyShowSchema.get("main_table")!;
      }

      let result = await this.dataBase.sqlCommandWithReponse(sqlCommand);
      this.sqlCommand = sqlCommand;
      const table = result.map((row: string | number) => Object.values(row));

      const partialTableData = {
        schema: mainSchema,
        table: table,
      };
      this.browserWindow.webContents.send(
        "tableDataFromBackend",
        partialTableData
      );

      return "ok";
    } catch (error) {
      console.error("Error executing SQL command:", error);
      return "An error occurred while executing the SQL command";
    }
  }

  public async getTableSchema(tableName: string): Promise<string[]> {
    let schema: string[];
    if (this.currentlyShowSchema.get(tableName)) {
      schema = this.currentlyShowSchema.get(tableName)!;
    } else {
      const schemaQuery = `PRAGMA table_info(${tableName})`;
      const schemaResult = await this.dataBase.sqlCommandWithReponse(
        schemaQuery
      );
      schema = schemaResult.map((row: any) => row.name);
    }
    return schema;
  }

  public async checkForTable(tableName: string): Promise<boolean> {
    const query = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
    const result = await this.dataBase.sqlCommandWithReponse(query);
    return result.length > 0;
  }

  public async exportToExcel() {
    try {
      const table = await this.getFullTable();
      const keySet = new Set(this.currentlyShowSchema.keys());
      const schema: string[] = Array.from(
        this.currentlyShowSchema.values()
      ).flat();

      const cleanedSchema = schema.filter(
        (value) => !keySet.has(value) && !value.toLowerCase().includes("id")
      );

      const fullTable: TableData = {
        schema: cleanedSchema,
        table: table,
      };
      const filePath = `${this.persistencePath}excelData.xlsx`;
      await this.excelExporter.exportResultToExcel(fullTable, filePath);
    } catch (error) {
      console.error("Error during Excel export:", error);
      throw new Error("Failed to export to Excel");
    }
  }

  private async getFullTable(): Promise<(string | number)[][]> {
    try {
      let lastSqlCommand = this.sqlCommand;
      if (!lastSqlCommand) {
        throw new Error("No SQL command available");
      }

      lastSqlCommand = lastSqlCommand
        .replace(/\bLIMIT\s+\d+(\s*,\s*\d+)?/gi, "")
        .replace(/\bOFFSET\s+\d+/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      console.log("SQL command after cleaning:", lastSqlCommand);

      const result = await this.dataBase.sqlCommandWithReponse(lastSqlCommand);
      const table = result.map((row: string | number) => Object.values(row));
      const schema = this.currentlyShowSchema.get("main_table")!;
      for (const [rowIndex, row] of table.entries()) {
        for (let colIndex = 1; colIndex < row.length; colIndex++) {
          const element = row[colIndex];

          if (typeof element === "number" && colIndex !== 0) {
            const foreignRow: (string | number)[] = await this.getRow(
              element,
              schema[colIndex]
            );

            table[rowIndex].splice(colIndex, 1);
            const foreignValues = foreignRow.slice(1);
            table[rowIndex].splice(colIndex, 0, ...foreignValues);
          }
        }
      }

      return table.map((row) => row.slice(1));
    } catch (error) {
      console.error("Error getting full table data:", error);
      return []; // Return empty array on error
    }
  }

  public getDiskData() {
    try {
      const sqlCommandData = fs.readFileSync(
        path.resolve(this.persistencePath, "sqlcommand.json"),
        "utf-8"
      );
      console.info("SQL Command data:", sqlCommandData);

      this.sqlCommand = JSON.parse(sqlCommandData).sqlCommand;

      const shownSchemaData = JSON.parse(
        fs.readFileSync(
          path.resolve(this.persistencePath, "shownSchema.json"),
          "utf-8"
        )
      );
      this.currentlyShowSchema = new Map(shownSchemaData);

      const mainSchemaData = JSON.parse(
        fs.readFileSync(
          path.resolve(this.persistencePath, "schema.json"),
          "utf-8"
        )
      );
      this.mainSchema = new Map(mainSchemaData);

      this.currentForeignSchemaToSelect = JSON.parse(
        fs.readFileSync(
          path.resolve(this.persistencePath, "foreignColumn.json"),
          "utf-8"
        )
      );
    } catch (error) {
      console.error("Error parsing JSON data:", error);
      throw error;
    }
  }

  public async amountOfRows(tableName: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const result = await this.dataBase.sqlCommandWithReponse(query);
    return result[0].count;
  }

  async getRow(id: number, tableName: string): Promise<(string | number)[]> {
    try {
      let schema: string[] = [];
      if (this.currentForeignSchemaToSelect.length !== 0) {
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
    } catch (error) {
      console.error(`Error getting row from ${tableName}:`, error);
      // Return empty array or default value instead of throwing
      return ["not found"];
    }
  }

  async cleanDatabase(): Promise<void> {
    try {
      await this.dataBase.recreateDatabase();
      this.tableBuilder = new TableBuilder();
      this.schemaBuilder = new SchemaBuilder(new SqlTextGenerator());
      this.excelExporter = new ExcelExporter();
      this.mainSchema = new Map();
      this.currentlyShowSchema = new Map();
      this.currentForeignSchemaToSelect = [];
      this.sqlCommand = "SELECT * FROM main_table";
      const file1Path = path.resolve(
        this.persistencePath,
        "foreignColumn.json"
      );
      const file2Path = path.resolve(this.persistencePath, "schema.json");
      const file3Path = path.resolve(this.persistencePath, "shownSchema.json");
      const file4Path = path.resolve(this.persistencePath, "sqlcommand.json");

      if (fs.existsSync(file1Path)) {
        fs.unlinkSync(file1Path);
        console.info(`Deleted file: ${file1Path}`);
      } else {
        console.warn(`File not found: ${file1Path}`);
      }

      if (fs.existsSync(file2Path)) {
        fs.unlinkSync(file2Path);
        console.info(`Deleted file: ${file2Path}`);
      } else {
        console.warn(`File not found: ${file2Path}`);
      }

      if (fs.existsSync(file3Path)) {
        fs.unlinkSync(file3Path);
        console.info(`Deleted file: ${file3Path}`);
      } else {
        console.warn(`File not found: ${file3Path}`);
      }

      if (fs.existsSync(file4Path)) {
        fs.unlinkSync(file4Path);
        console.info(`Deleted file: ${file4Path}`);
      } else {
        console.warn(`File not found: ${file4Path}`);
      }
      console.info("Database file deleted successfully.");
    } catch (error) {
      console.error("Error deleting the database file:", error);
      throw new Error("Failed to delete the database file.");
    }
  }

  async renameColumn(
    sqlCommand: string,
    schema: string[],
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
    const newSchema = schema.map((col) =>
      col === oldColumnName ? newColumnName : col
    );
    console.log("sqlcommand from rename", sqlCommand);
    await this.uiSqlCommand(sqlCommand, newSchema);
  }

  async getAllValues(columnName: string): Promise<String[]> {
    try {
      let tableName;
      for (const key of this.mainSchema.keys()) {
        if (this.mainSchema.get(key)?.includes(columnName)) {
          tableName = key;

          break;
        }
      }
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

  async getMaxRowValue(): Promise<number> {
    try {
      const query = `SELECT MAX(id) AS max_id FROM main_table;`;
      const result = await this.dataBase.sqlCommandWithReponse(query);
      return result[0].max_id;
    } catch (error) {
      console.error("Error getting the maximum row value:", error);
      throw new Error("Failed to get the maximum row value");
    }
  }
}

export default MainManager;
