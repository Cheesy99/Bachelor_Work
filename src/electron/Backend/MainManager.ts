import DataBaseConnector from "./DataBaseConnector.js";
import ExcelExporter from "./ExcelExporter.js";
import JsonObject from "./Interfaces/JsonObject.js";
import SchemaBuilder from "./SchemaBuilder.js";
import SQLBuilder from "./SQLBuilder.js";
import TableBuilder from "./TableBuilder.js";
import SqlTextGenerator from "./SQLTextGenerator.js";

class MainManager {
  private static instance: MainManager;
  private dataBase: DataBaseConnector;
  private sqlBuilder: SQLBuilder;
  private excelExporter: ExcelExporter;
  public static getInstance(): MainManager {
    if (!MainManager.instance) {
      MainManager.instance = new MainManager();
    }
    return MainManager.instance;
  }

  private constructor() {
    this.dataBase = DataBaseConnector.getInstance();
    this.sqlBuilder = new SQLBuilder(
      new SchemaBuilder(),
      new TableBuilder(),
      new SqlTextGenerator()
    );
    this.excelExporter = new ExcelExporter();
  }

  get dataBaseExist() {
    return this.dataBase.databaseExists();
  }

  public async insertJson(json: string): Promise<void> {
    const jsonObject: JsonObject[] = JSON.parse(json);
    let schemaSqlCommand: string[] = this.sqlBuilder.getSchema(jsonObject);
    await this.dataBase.sqlCommand(schemaSqlCommand);
    let inputDataSqlCommand = this.sqlBuilder.getData(jsonObject);
    await this.dataBase.sqlCommand(inputDataSqlCommand);
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
    console.log(result[0].count);
    return result[0].count;
  }
}

export default MainManager;
