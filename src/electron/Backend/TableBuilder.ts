import TableData from "./Interfaces/TableData.js";
import TableSchema from "./Interfaces/TableSchema.js";
import JsonObject from "./Interfaces/JsonObject.js";
class TableBuilder {
  private tableDate: TableData[] = [];
  private foreignIndex: number = 0;
  private mainIndex: number = 0;
  public build(json: JsonObject[], tableSchema: TableSchema): TableData[] {
    Object.keys(tableSchema).forEach((key: string) => {
      tableSchema[key].push("id");
      this.tableDate.push({
        schema: { [key]: tableSchema[key] },
        table: [],
      });
    });

    console.log("TableData", JSON.stringify(this.tableDate, null, 2));
    json.forEach((object) => {
      this.recursive(object, "main_table");
    });

    return this.tableDate;
  }

  private recursive(json: JsonObject, tableName: string) {
    let row: { key: string; value: string | number; tableName: string }[] = [];

    Object.keys(json).forEach((key) => {
      if (Array.isArray(json[key])) {
        json[key].forEach((values) => {
          row.push({ key: key, value: this.foreignIndex++, tableName });
          this.recursive(values, key);
        });
      } else {
        row.push({ key: key, value: json[key], tableName: tableName });
      }
    });

    this.incertRow(row!);
  }

  private incertRow(
    row: { key: string; value: string | number; tableName: string }[]
  ) {}
}
export default TableBuilder;
