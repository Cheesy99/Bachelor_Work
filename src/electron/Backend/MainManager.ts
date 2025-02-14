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
  async getAllTableName(): Promise<string[]> {
    try {
      const query = `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`;
      const result = await this.dataBase.sqlCommandWithResponse(query);
      return result.map((row: any) => row.name);
    } catch (error) {
      console.error("Error getting all table names:", error);
      throw new Error("Failed to get all table names");
    }
  }
  async getTable(command: string): Promise<TableData> {
    try {
      const result = await this.dataBase.sqlCommandWithResponse(command);
      if (result.length === 0) {
        return { schema: [], table: [] };
      }

      const schema = Object.keys(result[0]);
      const table = result.map((row: any) => {
        const rowData: (string | number)[] = [];
        schema.forEach((key) => {
          rowData.push(row[key]);
        });
        return rowData;
      });

      return { schema, table };
    } catch (error) {
      console.error("Error getting table:", error);
      throw new Error("Failed to get table");
    }
  }
  private browserWindow: BrowserWindow;
  private dataBase: DataBaseConnector;
  private excelExporter: ExcelExporter;
  private schemaBuilder: SchemaBuilder;
  private tableBuilder: TableBuilder;
  private readonly persistencePath: string;
  private sqlCommandStack: string[] = [""];

  public constructor(browserWindow: BrowserWindow) {
    this.persistencePath = path.join(__dirname, isDev() ? "../../" : "../");
    this.dataBase = DataBaseConnector.getInstance();
    this.tableBuilder = new TableBuilder();
    this.schemaBuilder = new SchemaBuilder(new SqlTextGenerator());
    this.excelExporter = new ExcelExporter();
    this.browserWindow = browserWindow;
  }

  public popStack(): void {
    this.sqlCommandStack.pop();
  }

  public checkForDisk(): boolean {
    let everything: boolean = true;
    const filePath3 = path.join(this.persistencePath, "sqlCommandStack.json");

    if (!fs.existsSync(filePath3)) {
      console.warn("sqlCommandStack.json is missing");
      everything = false;
    }

    return everything;
  }

  get dataBaseExist() {
    return this.dataBase.databaseExists();
  }

  // Here I should return the starting sql command
  public async insertJson(json: string): Promise<string> {
    try {
      const cleanedJsonString = json.replace(/\\"/g, "");
      const cleanedJson = cleanedJsonString.replace(/"([^"]+)":/g, (_, p1) => {
        const cleanedKey = DataCleaner.cleanName(p1);
        return `"${cleanedKey}":`;
      });

      const jsonObject: JsonObject[] = JSON.parse(cleanedJson);
      const schemaResult: {
        command: string[];
        tableSchema: TableSchema;
      } = this.schemaBuilder.generateSchemaWithCommand(jsonObject);

      await this.dataBase.sqlCommand(schemaResult.command);
      const mainInsert: any[] = await this.tableBuilder.build(
        jsonObject,
        schemaResult.tableSchema
      );
      await this.dataBase.sqlCommand(mainInsert);
      const sqlCommand = await this.constructInitialSqlCommand();

      const tableObject = await this.dataBase.sqlCommandWithResponse(
        sqlCommand
      );
      this.browserWindow.webContents.send("tableDataFromBackend", tableObject);
      this.sqlCommandStack.push(sqlCommand);
      return sqlCommand;
    } catch (error) {
      console.error("Error handling insertJson:", error);
      return "Invalid Json object please give valid json object";
    }
  }

  private async constructInitialSqlCommand(): Promise<string> {
    const tableNames: string[] = await this.getAllTableName();
    const mainTable = "main_table";
    const joinConditions = tableNames
      .filter((tableName) => tableName !== mainTable)
      .map(
        (tableName) =>
          `LEFT JOIN ${tableName} ON ${mainTable}.id = ${tableName}.id`
      )
      .join(" ");

    return `SELECT * FROM ${mainTable} ${joinConditions} LIMIT 100;`;
  }

  public async initTableData(): Promise<void> {
    let schema: string[] = [];
    let table: (string | number)[][] = [];

    if (this.checkForDisk()) {
      this.getDiskData();
      this.uiSqlCommand(this.sqlCommandStack[this.sqlCommandStack.length - 1]);
    } else {
      const dataQuery = "SELECT * FROM main_table LIMIT 100 OFFSET 0;";
      const dataResult = await this.dataBase.sqlCommandWithResponse(dataQuery);
      schema = Object.keys(dataResult[0]);
      table = dataResult.map((row: string | number) => Object.values(row));

      const tableData: TableData = { schema: schema, table: table };
      this.browserWindow.webContents.send("tableDataFromBackend", tableData);
    }
  }

  public saveToDiskWhenQuit(): void {
    const sqlCommandFilePath = path.join(
      this.persistencePath,
      "sqlCommandStack.json"
    );
    const sqlCommandSave = this.sqlCommandStack;
    try {
      fs.writeFileSync(
        sqlCommandFilePath,
        JSON.stringify({ sqlCommand: sqlCommandSave })
      );
      console.info("Schema saved to disk successfully.");
    } catch (err) {
      console.error("Error writing schema to disk:", err);
    }
  }

  public async uiSqlCommand(sqlCommand: string): Promise<string> {
    try {
      const resultObject = await this.dataBase.sqlCommandWithResponse(
        sqlCommand
      );

      this.browserWindow.webContents.send("tableDataFromBackend", resultObject);
      this.sqlCommandStack.push(sqlCommand);
      return sqlCommand;
    } catch (error) {
      console.error("Error executing SQL command:", error);
      return "An error occurred while executing the SQL command";
    }
  }
  async getForeignIds(
    foreignTableName: string,
    foreignColumnName: string,
    values: any
  ): Promise<number[]> {
    const placeholders = values.map((val: string) => `'${val}'`).join(", ");
    const query = `SELECT id FROM ${foreignTableName} WHERE ${foreignColumnName} IN (${placeholders})`;
    const result = await this.dataBase.sqlCommandWithResponse(query);

    return result.map((row: { id: number }) => row.id);
  }

  // public async getTableSchema(tableName: string): Promise<string[]> {}

  public async checkForTable(tableName: string): Promise<boolean> {
    const query = `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
    const result = await this.dataBase.sqlCommandWithResponse(query);
    return result.length > 0;
  }

  public async exportToExcel(): Promise<void> {
    try {
      // Here we have to get the table
      const fullTable = { schema: [], table: [] };
      const filePath = `${this.persistencePath}excelData.xlsx`;
      await this.excelExporter.exportResultToExcel(fullTable, filePath);
    } catch (error) {
      console.error("Error during Excel export:", error);
      throw new Error("Failed to export to Excel");
    }
  }

  public getDiskData() {
    try {
      const sqlCommandData = fs.readFileSync(
        path.resolve(this.persistencePath, "sqlCommandStack.json"),
        "utf-8"
      );
      console.info("SQL Command data:", sqlCommandData);

      const parsedData = JSON.parse(sqlCommandData);
      if (parsedData && parsedData.sqlCommand) {
        this.sqlCommandStack = parsedData.sqlCommand;
      } else {
        console.error("Parsed data does not contain sqlCommand:", parsedData);
      }
    } catch (error) {
      console.error("Error parsing JSON data:", error);
      throw error;
    }
  }

  public async amountOfRows(tableName: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const result = await this.dataBase.sqlCommandWithResponse(query);
    return result[0].count;
  }

  async getRow(id: number, tableName: string): Promise<(string | number)[]> {
    try {
      let schema: string[] = [];

      const finale = schema.length <= 1 ? "*" : schema.join(" ,");
      const result = await this.dataBase.sqlCommandWithResponse(
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
      this.sqlCommandStack = [""];

      const file4Path = path.resolve(
        this.persistencePath,
        "sqlCommandStack.json"
      );

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
  ): Promise<void> {}

  async getAllValues(columnName: string): Promise<string[]> {
    try {
      let tableName;
      if (!tableName) {
        throw new Error(`Table for column ${columnName} not found in schema.`);
      }

      const query = `SELECT ${columnName} FROM ${tableName};`;
      const result = await this.dataBase.sqlCommandWithResponse(query);

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
      const result = await this.dataBase.sqlCommandWithResponse(query);
      return result[0].max_id;
    } catch (error) {
      console.error("Error getting the maximum row value:", error);
      throw new Error("Failed to get the maximum row value");
    }
  }

  public async isForeignTable(tableName: string): Promise<boolean> {
    const query = `SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name != 'main_table' 
    AND name = '${tableName}';`;

    const result = await this.dataBase.sqlCommandWithResponse(query);
    return result.length > 0;
  }

  getStack(): string[] {
    return this.sqlCommandStack;
  }
  hasStack(): boolean {
    const stackFilePath = path.resolve(
      this.persistencePath,
      "sqlCommandStack.json"
    );
    return fs.existsSync(stackFilePath);
  }
}

export default MainManager;
