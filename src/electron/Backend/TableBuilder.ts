import TableData from "./Interfaces/TableData.js";
import TableSchema from "./Interfaces/TableSchema.js";
import JsonObject from "./Interfaces/JsonObject.js";
import Row from "./Interfaces/Row.js";
class TableBuilder {
  private tableDate: TableData[] = [];
  private foreignIndex: number = 0;
  private shiftingStack: Row[] = [];
  private mainTableIndex: number = 0;
  public build(json: JsonObject[], tableSchema: TableSchema): TableData[] {
    Object.keys(tableSchema).forEach((key: string) => {
      tableSchema[key].push("id");
      this.tableDate.push({
        schema: { [key]: tableSchema[key] },
        table: [],
      });
    });

    json.forEach((object, index) => {
      this.recursive(object, "main_table", index);
    });

    this.mainTableCleaner();

    return this.tableDate;
  }

  private recursive(json: JsonObject, tableName: string, id: number) {
    let row: { key: string; value: string | number; tableName: string }[] = [];
    row.push({ key: "id", value: id, tableName });
    Object.keys(json).forEach((key) => {
      if (Array.isArray(json[key])) {
        json[key].forEach((values) => {
          row.push({ key: key, value: this.foreignIndex, tableName });
          this.recursive(values, key, this.foreignIndex++);
        });
      } else {
        row.push({ key: key, value: json[key], tableName: tableName });
      }
    });
    this.insertRow(row!);
  }

  private insertRow(row: Row[]) {
    let duplicateKeys: Row[] = [];
    let seenKeys: Set<string | number> = new Set();

    const filteredRow = row.filter((value) => {
      if (seenKeys.has(value.key)) {
        duplicateKeys.push(value);
        return false;
      } else {
        seenKeys.add(value.key);
        return true;
      }
    });
    this.insertData(filteredRow);
    duplicateKeys.forEach((row) => {
      this.insertHelper(row, filteredRow);
    });
  }

  private insertHelper(element: Row, row: Row[]) {
    let index = row.findIndex((row) => row.key === element.key);
    this.shiftingStack.push(row[index]);
    row[index] = element;
    this.insertData(row);
    if (this.checkIfAnotherKeyTypeExists(element)) {
      this.shiftingStack
        .filter((row) => row.key !== element.key)
        .forEach((element) => {
          let index = row.findIndex((row) => row.key === element.key);
          row[index] = element;
          this.insertData(row);
        });
    }
  }

  private checkIfAnotherKeyTypeExists(row: Row): boolean {
    return this.shiftingStack.some((element) => element.key === row.key);
  }

  private insertData(row: Row[]) {
    const tableData = this.tableDate.find((table) =>
      table.schema.hasOwnProperty(row[0].tableName)
    );
    if (!tableData) throw new Error("Table schema doesn't have row tablename");

    const schemaKeys = tableData.schema[row[0].tableName];
    const rowData: (string | number)[] = schemaKeys.map((key) => {
      const cell = row.find((r) => r.key === key);
      return cell ? cell.value : "bugg";
    });
    tableData.table.push(rowData);
  }

  private mainTableCleaner() {
    let idIndex = this.tableDate[0].schema["main_table"].findIndex(
      (value) => value === "id"
    );

    this.tableDate[0].table.forEach((row) => {
      row[idIndex] = this.mainTableIndex++;
    });
  }
}
export default TableBuilder;
