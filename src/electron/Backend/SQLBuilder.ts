import JsonObject from "./Interfaces/JsonObject.js";
import TableSchema from "./Interfaces/TableSchema.js";
import SchemaBuilder from "./SchemaBuilder.js";
import DataCleaner from "./Utils/DataCleaner.js";
import SqlTextGenerator from "./SqlTextGenerator.js";
class SqlBuilder {
  private schemaBuilder: SchemaBuilder;
  private sqlTextBuilder: SqlTextGenerator;
  public constructor(
    schemaBuilder: SchemaBuilder,
    sqlTextBuilder: SqlTextGenerator
  ) {
    this.schemaBuilder = schemaBuilder;
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

  get textBuilder() {
    return this.sqlTextBuilder;
  }
}

export default SqlBuilder;
