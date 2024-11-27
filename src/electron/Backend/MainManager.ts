import DataBaseConnector from "./DataBaseConnector.js";
import ExcelExporter from "./ExcelExporter.js";
import JsonObject from "./Interfaces/JsonObject.js";
import TableSchema from "./Interfaces/tableSchema.js";
import SchemaBuilder from "./SchemaBuilder.js";
import SQLBuilder from "./SQLBuilder.js";
import TableBuilder from "./TableBuilder.js";

class MainManager {
  private static instance: MainManager;
  private dataBase: DataBaseConnector;
  private sqlBuilder: SQLBuilder;
  private excelExporter: ExcelExporter;
  public static getInstance(): MainManager {
    if (!MainManager.getInstance) {
      MainManager.instance = new MainManager();
    }

    return MainManager.instance;
  }

  private constructor() {
    this.dataBase = DataBaseConnector.getInstance();
    this.sqlBuilder = new SQLBuilder(new SchemaBuilder(), new TableBuilder());
    this.excelExporter = new ExcelExporter();
  }

  public insertJson(json: JsonObject[]) {
    let schemaString: TableSchema[] = this.sqlBuilder.getSchema(json);
  }
  public sqlCommand() {}
  public exportToExcel() {}
}

export default MainManager;
