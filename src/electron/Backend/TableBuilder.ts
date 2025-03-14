import TableSchema from "./Interfaces/TableSchema.js";
import JsonObject from "./Interfaces/JsonObject.js";
import DataBaseConnector from "./DataBaseConnector.js";
class TableBuilder {
  private databaseConnector: DataBaseConnector =
    DataBaseConnector.getInstance();
  private collectMainInserts: (string | number)[] = [];
  public async build(
    json: JsonObject[],
    tableSchema: TableSchema
  ): Promise<(string | number)[]> {
    await Promise.all(
      json.map(async (object) => {
        await this.recursive(object, tableSchema, "main_table");
      })
    );
    return this.collectMainInserts;
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
    const totalRes: Promise<number>[][] = [];

    for (const columnName of columnNames) {
      const realKey = columnName.includes("_")
        ? columnName.split("_").pop()
        : columnName;
      if (!realKey) {
        continue;
      }
      let value = json[realKey] ? json[realKey] : "not found";
      if (Array.isArray(value)) {
        const res: Promise<number>[] = value.map(async (Innererow) => {
          return await this.recursive(Innererow, tableSchema, columnName);
        });

        totalRes.push(res);
        insertOrderForeign.push(columnName);
      } else if (typeof value === "object") {
        const result: Promise<number> = this.recursive(
          value,
          tableSchema,
          columnName
        );
        totalRes.push([result]);
        insertOrderForeign.push(columnName);
      } else {
        typeof value === "string"
          ? (value = `'${value.replace(/'/g, "''")}'`)
          : value;
        insertOrderMain.push(columnName);
        insertValues.push(value as string);
      }
    }
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

      result = await this.joinCrossProduct(insertValues, resolvedTotalRes);
      await Promise.all(
        result.map(async (statement) => {
          const insertStatement: any = `INSERT INTO ${tableName} (${insertColumnString}) VALUES (${statement.join(
            ", "
          )});`;

          this.collectMainInserts.push(insertStatement);
        })
      );
    } else {
      const baseString: string = insertValues.join(", ");
      const insertBase = `INSERT INTO ${tableName} (${insertColumnString}) VALUES (${baseString});`;
      return await this.insertWithIdResponse(insertBase);
    }

    return -1;
  }

  private async insertWithIdResponse(statement: any): Promise<number> {
    return await this.databaseConnector.sqlCommandWithIdResponse(statement);
  }
  private async joinCrossProduct(
    baseArray: any[],
    foreignIds: any[][]
  ): Promise<any[][]> {
    return new Promise((resolve) => {
      const result: any[][] = [];

      const processedForeignIds = foreignIds.map((arr) =>
        arr.length === 0 ? ["null"] : arr
      );

      function accumulator(current: any[], index: number) {
        if (index === processedForeignIds.length) {
          result.push([...baseArray, ...current]);
          return;
        }

        for (const foreignKeys of processedForeignIds[index]) {
          accumulator([...current, foreignKeys], index + 1);
        }
      }

      accumulator([], 0);
      resolve(result);
    });
  }
}
export default TableBuilder;
