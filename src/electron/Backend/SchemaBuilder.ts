import TableSchema from "./Interfaces/TableSchema.js";
import JsonObject from "./Interfaces/JsonObject.js";

class SchemaBuilder {
  public build(json: JsonObject[]): TableSchema[] {
    let result: TableSchema[] = [];
    if (Array.isArray(json)) {
      json.forEach((obj, index) =>
        result.push(...this.removeDuplicates(this.recursiveSchema(obj, index)))
      );
    }
    return this.removeDuplicates(result);
  }

  private recursiveSchema(
    json: JsonObject,
    tableName: string | number
  ): TableSchema[] {
    let keys = Object.keys(json);
    let result = [{ [tableName]: keys }];
    keys.forEach((key) => {
      if (Array.isArray(json[key])) {
        json[key].forEach((obj) => {
          result.push(...this.recursiveSchema(obj, key));
        });
      }
    });

    return result;
  }

  private removeDuplicates(tableSchema: TableSchema[]): TableSchema[] {
    const seen = new Set();
    return tableSchema.filter((tableSchema) => {
      const jsonString = JSON.stringify(tableSchema);
      return seen.has(jsonString) ? false : seen.add(jsonString);
    });
  }
}
export default SchemaBuilder;
