import TableData from "./Interfaces/TableData.js";
import TableSchema from "./Interfaces/TableSchema.js";
import JsonObject from "./Interfaces/JsonObject.js";
class TableBuilder {
  public build(json: JsonObject[], tableSchema: TableSchema): TableData[] {
    let result: TableData[] = [];

    Object.keys(tableSchema).forEach((key: string) => {
      result.push({
        schema: { [key]: tableSchema[key] },
        table: [],
      });
    });

    console.log("TableData", result);
    Object.keys(json).forEach((key) => {
      // Reference to table data object n results array
      const tableData = result.find((table) => {
        table.schema.hasOwnProperty(key);
      });
      if (tableData) {
        // tableData.table.push(this.recursive(json, result, 0));
      }
    });

    return result;
  }

  private recursive(json: JsonObject, result: TableData[], idIndex: number) {
    let collector: TableData[];
    Object.keys(json).forEach((key) => {
      if (Array.isArray(json[key])) return;
      // collector.push(...this.recursiveHelper(json[key], result, idIndex));
    });
  }

  private recursiveHelper(
    json: JsonObject[],
    result: TableData[],
    idIndex: number
  ) {}
}
export default TableBuilder;
