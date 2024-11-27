import tableSchema from "../DataBase/Interfaces/tableSchema.js";
import JsonObject from "./Interfaces/JsonObject.js";
import TableSchema from "./Interfaces/tableSchema.js";

class SchemaBuilder {
  private result: TableSchema[] = [];

  public build(json: JsonObject[]): TableSchema[] {
    json.forEach((obj, index) => {
      this.result.push(...this.recursiveSchema(obj, [], index));
    });

    return this.result;
  }

  private recursiveSchema(
    json: JsonObject,
    tableSchema: TableSchema[],
    tableName: string | number
  ): TableSchema[] {
    let tableResult: TableSchema = { [tableName]: [] };
    Object.keys(json).forEach((key) => {
      if (Array.isArray(json[key])) {
        tableResult[tableName].push(key);
        tableSchema.push(...this.recursiveSchema(json[key], [], key));
      } else if (typeof json[key] === "string") {
        tableSchema.push({ key: schema.push(json[key]) });
      } else {
      }
    });
  }
}
export default SchemaBuilder;
