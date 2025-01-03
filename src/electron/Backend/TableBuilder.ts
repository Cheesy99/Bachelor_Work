import TableDataBackend from "./Interfaces/TableData.js";
import TableSchema from "./Interfaces/TableSchema.js";
import JsonObject from "./Interfaces/JsonObject.js";
import DataBaseConnector from "./DataBaseConnector.js";
class TableBuilder {
  private foreignIndex: number = 0;
  private databaseConnector: DataBaseConnector =
    DataBaseConnector.getInstance();

  public build(json: JsonObject[], tableSchema: TableSchema) {
    json.forEach((object) => {
      this.recursive(object, tableSchema, "main_table");
    });
  }

  private recursive(
    json: JsonObject,
    tableSchema: TableSchema,
    tableName: string
  ): string {
    const columnNames: string[] = tableSchema[tableName];
    let totalRes: string[][] = [];
    columnNames.forEach((columnName) => {
      let value = json[columnName] ? json[columnName] : "not found";
      if (Array.isArray(value)) {
        const res: string[] = value.map((Innererow) => {
          return this.recursive(Innererow, tableSchema, columnName);
        });
        totalRes.push(res);
      } else {
        columnNames.push(value);
      }
    });
    let baseString: string;
    let result = this.transformGeneric(baseString, totalRes);
  }

  private transformGeneric(
    baseString: string,
    foreignIds: string[][]
  ): string[] {
    const result: string[] = [];

    function accumulator(current: string[], index: number) {
      if (index === foreignIds.length) {
        result.push(`${baseString}, ${current.join(", ")}`);
        return;
      }

      for (const value of foreignIds[index]) {
        accumulator([...current, value], index + 1);
      }
    }

    accumulator([], 0);
    return result;
  }

  public createInputDataText(tableData: TableDataBackend[]): string[] {
    const returnCommandQueue: string[] = [];
    tableData.reverse().forEach((tableData) => {
      let key = Object.keys(tableData.schema)[0];
      let sqlCommand: string = `INSERT INTO ${key} (${tableData.schema[
        key
      ].join(", ")}) VALUES `;

      tableData.table.forEach((row) => {
        const escapedRow = row.map((value) =>
          typeof value === "string" ? `'${value.replace(/'/g, "bugg")}'` : value
        );
        sqlCommand += `( ${escapedRow.join(", ")} ),`;
      });

      sqlCommand = sqlCommand.slice(0, -1) + ";";
      returnCommandQueue.push(sqlCommand);
    });
    return returnCommandQueue;
  }
}
export default TableBuilder;
