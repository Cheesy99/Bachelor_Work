import { JsonToSqlMapper } from "./jsonToSQLMapper.js";
import { EventEmitter } from "events";
import SchemaBuilder from "./schemaBuilder.js";
import FieldNames from "./Interfaces/fieldNames.js";
import JsonObject from "./Interfaces/JsonObject.js";
import TableData from "./Interfaces/TableData.js";

class DataLoader extends EventEmitter {
  private mapper: JsonToSqlMapper;
  private schemaBuilder: SchemaBuilder;
  private schemaStructure?: FieldNames[];
  constructor(mapper: JsonToSqlMapper, schemaBuilder: SchemaBuilder) {
    super();
    this.mapper = mapper;
    this.schemaBuilder = schemaBuilder;
  }

  public async loadData(jsonData: string) {
    try {
      const jsonObject: JsonObject = JSON.parse(jsonData);
      this.schemaBuilder.createSchema(jsonObject);
      this.schemaStructure = this.schemaBuilder.schema;

      try {
        let amount_of_rows_in_main = this.mapper.insertData(
          jsonObject,
          this.schemaStructure!
        );
        this.emit("dataLoaded", amount_of_rows_in_main);
      } catch (error) {
        console.error("Schema is undefined", error);
      }
    } catch (error) {
      console.error("Error parsing JSON data", error);
    }
  }

  public async getTable(
    fromID: number[],
    tableName: string //Promise<TableData> {
  ) {}
}

export default DataLoader;
