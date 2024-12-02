import SQLTextGenerator from "./SQLTextGenerator.js";
import JsonObject from "./Interfaces/JsonObject.js";
import TableSchema from "./Interfaces/TableSchema.js";
import SchemaBuilder from "./SchemaBuilder.js";
import TableBuilder from "./TableBuilder.js";
import DataCleaner from "./Utils/DataCleaner.js";
import TableData from "./Interfaces/TableData.js";
class SQLBuilder {
  private schemaBuilder: SchemaBuilder;
  private tableBuilder: TableBuilder;
  private sqlTextBuilder: SQLTextGenerator;
  private tableSchema?: TableSchema;
  public constructor(
    schemaBuilder: SchemaBuilder,
    tableBuilder: TableBuilder,
    sqlTextBuilder: SQLTextGenerator
  ) {
    this.schemaBuilder = schemaBuilder;
    this.tableBuilder = tableBuilder;
    this.sqlTextBuilder = sqlTextBuilder;
  }

  public getSchema(json: JsonObject[]): string[] {
    this.tableSchema = this.schemaBuilder.build(json);
    let command = this.sqlTextBuilder.createSchemaText(this.tableSchema);
    return DataCleaner.cleanSqlCommand(command);
  }

  public getData(json: JsonObject[]) {
    let tableData: TableData[] = this.tableBuilder.build(
      json,
      this.tableSchema!
    );

    return this.sqlTextBuilder.createInputDataText(tableData);
  }
}

export default SQLBuilder;
