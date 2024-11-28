import { JsonToSqlMapper } from "./jsonToSQLMapper.js";
import { EventEmitter } from "events";
// import SchemaBuilder from "./schemaBuilder.js";
import SchemaBuilder from "../Backend/SchemaBuilder.js";
import FieldNames from "./Interfaces/fieldNames.js";
import JsonObject from "./Interfaces/JsonObject.js";
import TableData from "./Interfaces/TableData.js";
import DatabaseManager from "./DataBaseManager/dataBaseManager.js";

class DataLoader extends EventEmitter {
  private mapper: JsonToSqlMapper;
  private schemaBuilder: SchemaBuilder;
  constructor(mapper: JsonToSqlMapper, schemaBuilder: SchemaBuilder) {
    super();
    this.mapper = mapper;
    this.schemaBuilder = schemaBuilder;
  }

  public loadData(jsonData: string): void {
    try {
      const jsonObject: JsonObject[] = JSON.parse(jsonData);
      let result = this.schemaBuilder.build(jsonObject);

      try {
        this.mapper.insertData(jsonObject, result);
      } catch (error) {
        console.error("Schema is undefined", error);
      }
    } catch (error) {
      console.error("Error parsing JSON data", error);
    }
  }

  public async getTable(
    fromID: [startingId: number, endId: number],
    tableName: string
  ): Promise<TableData> {
    const dbManager = DatabaseManager.getInstance();
    return dbManager.getTableData(fromID, tableName);
  }
}

export default DataLoader;
