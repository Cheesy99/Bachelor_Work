import TableDataBackend from "./Interfaces/TableData.js";
import TableSchema from "./Interfaces/TableSchema.js";
import JsonObject from "./Interfaces/JsonObject.js";
import DataBaseConnector from "./DataBaseConnector.js";
class TableBuilder {
  private databaseConnector: DataBaseConnector =
    DataBaseConnector.getInstance();

  public async build(
    json: JsonObject[],
    tableSchema: TableSchema
  ): Promise<void> {
    console.log("Processing");
    await Promise.all(
      json.map(async (object) => {
        await this.recursive(object, tableSchema, "main_table");
      })
    );
    console.log("done");
  }

  private async recursive(
    json: JsonObject,
    tableSchema: TableSchema,
    tableName: string
  ): Promise<number> {
    const columnNames: string[] = tableSchema[tableName];
    const insertOrderMain: string[] = [];
    const insertOrderForeign: string[] = [];
    const insertValues: string[] = [];
    let totalRes: Promise<number>[][] = [];
    columnNames.forEach(async (columnName) => {
      let value = json[columnName] ? json[columnName] : "not found";
      if (Array.isArray(value)) {
        const res: Promise<number>[] = value.map(async (Innererow) => {
          return await this.recursive(Innererow, tableSchema, columnName);
        });
        totalRes.push(res);
        insertOrderForeign.push(columnName);
      } else {
        typeof value === "string"
          ? (value = `'${value.replace(/'/g, "''")}'`)
          : value;
        insertOrderMain.push(columnName);
        insertValues.push(value);
      }
    });
    let insertColumnString: string = insertOrderMain.join(", ");

    if (insertOrderForeign.length > 0) {
      insertColumnString = insertColumnString
        .concat(", ")
        .concat(insertOrderForeign.join(", "));
    }
    let result: any[][] = [];
    if (totalRes.length !== 0) {
      const resolvedTotalRes = await Promise.all(
        totalRes.map((res) => Promise.all(res))
      );
      result = this.joinCrossProduct(insertValues, resolvedTotalRes);
      await Promise.all(
        result.map(async (statement) => {
          const insertStatement: any = `INSERT INTO ${tableName} (${insertColumnString}) VALUES (${statement.join(
            ", "
          )});`;

          return await this.insertWithIdReponse(insertStatement);
        })
      );
    } else {
      const baseString: string = insertValues.join(", ");
      const insertBase = `INSERT INTO ${tableName} (${insertColumnString}) VALUES (${baseString});`;
      return await this.insertWithIdReponse(insertBase);
    }

    return -1;
  }

  private async insertWithIdReponse(statment: any): Promise<number> {
    return await this.databaseConnector.sqlCommandWithIdResponse(statment);
  }
  // This is worng and is corrupting my data
  private joinCrossProduct(baseArray: any[], foreignIds: any[][]): any[][] {
    const result: any[][] = [];

    function accumulator(current: any[], index: number) {
      if (index === foreignIds.length) {
        result.push([...baseArray, ...current]);
        return;
      }

      for (const foreignKeys of foreignIds[index]) {
        accumulator([...current, foreignKeys], index + 1);
      }
    }

    accumulator([], 0);
    return result;
  }
}
export default TableBuilder;
