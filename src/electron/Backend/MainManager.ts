import DataBaseConnector from "./DataBaseConnector.js";
import ExcelExporter from "./ExcelExporter.js";
import JsonObject from "./Interfaces/JsonObject.js";
import TableSchema from "./Interfaces/TableSchema.js";
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

  public async insertJson(json: string): Promise<void> {
    const jsonObject: JsonObject[] = JSON.parse(json);
    let schemaSqlCommand: string[] = this.sqlBuilder.getSchema(jsonObject);
    await this.dataBase.sqlCommand(schemaSqlCommand);
    let inputDataSqlCommand = this.sqlBuilder.getData(jsonObject);
    console.log(inputDataSqlCommand);
    await this.dataBase.sqlCommand(inputDataSqlCommand);
  }
  public sqlCommand() {}
  public exportToExcel() {}
}

export default MainManager;
