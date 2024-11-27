import JsonObject from "./Interfaces/JsonObject.js";
import TableSchema from "./Interfaces/tableSchema.js";
import SchemaBuilder from "./SchemaBuilder.js";
import TableBuilder from "./TableBuilder.js";
class SQLBuilder {
  private schemaBuilder: SchemaBuilder;
  private tableBuilder: TableBuilder;
  public constructor(schemaBuilder: SchemaBuilder, tableBuilder: TableBuilder) {
    this.schemaBuilder = schemaBuilder;
    this.tableBuilder = tableBuilder;
  }

  getSchema(json: JsonObject[]): TableSchema[] {
    return this.schemaBuilder.build(json);
  }
}

export default SQLBuilder;
