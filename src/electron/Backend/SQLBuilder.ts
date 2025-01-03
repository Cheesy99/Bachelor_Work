import JsonObject from "./Interfaces/JsonObject.js";
import TableSchema from "./Interfaces/TableSchema.js";
import SchemaBuilder from "./SchemaBuilder.js";
import TableBuilder from "./TableBuilder.js";
import DataCleaner from "./Utils/DataCleaner.js";
import TableDataBackend from "./Interfaces/TableData.js";
import SqlTextGenerator from "./SqlTextGenerator.js";
import fs from "fs";
class SqlBuilder {
  private schemaBuilder: SchemaBuilder;
  private tableBuilder: TableBuilder;
  private sqlTextBuilder: SqlTextGenerator;
  public constructor(
    schemaBuilder: SchemaBuilder,
    tableBuilder: TableBuilder,
    sqlTextBuilder: SqlTextGenerator
  ) {
    this.schemaBuilder = schemaBuilder;
    this.tableBuilder = tableBuilder;
    this.sqlTextBuilder = sqlTextBuilder;
  }

  public getSchema(json: JsonObject[]): {
    command: string[];
    tableSchema: TableSchema;
  } {
    const tableSchema = this.schemaBuilder.build(json);
    let command = this.sqlTextBuilder.createSchemaText(tableSchema);
    return { command: DataCleaner.cleanSqlCommand(command), tableSchema };
  }

  public getTableInputCommand(
    json: JsonObject[],
    tableSchema: TableSchema
  ): string[] {
    let tableData: TableDataBackend[] = this.tableBuilder.build(
      json,
      tableSchema
    );
    fs.writeFileSync(
      "payload2.json",
      JSON.stringify(tableData, null, 2),
      "utf-8"
    );
    console.log("this is the size of insert small: ", tableData.length);
    return this.sqlTextBuilder.createInputDataText(tableData);
  }

  get textBuilder() {
    return this.sqlTextBuilder;
  }
}

export default SqlBuilder;
