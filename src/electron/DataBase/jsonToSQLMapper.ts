import TableSchema from "../Backend/Interfaces/TableSchema.js";
import SchemaBuilder from "../Backend/SchemaBuilder.js";
import DatabaseManager from "./DataBaseManager/dataBaseManager.js";
import FieldNames from "./Interfaces/fieldNames.js";
import Schema from "./Interfaces/fieldNames.js";
import JsonObject from "./Interfaces/JsonObject.js";
import tableSchema from "./Interfaces/tableSchema.js";

export class JsonToSqlMapper {
  private db;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  public insertData(jsonObject: JsonObject[], jsonSchemas: TableSchema): void {
    console.log("I am here ");
    this.db.schemaEntry(jsonSchemas);
    this.db.insertData(jsonObject);
  }
}

export default JsonToSqlMapper;
