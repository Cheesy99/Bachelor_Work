import ConversionStrategy from "./Interface/ConversionStrategy";

class OneTableConverter implements ConversionStrategy {
  public async convert(data: TableData): Promise<TableData> {
    return await this.createOneTable(data);
  }

  private async createOneTable(data: TableData): Promise<TableData> {
    const getAllTableName: string[] =
      await window.electronAPI.getAllTableName();

    // Construct the SQL command to join all tables with main_table as the parent
    const sqlCommand = this.constructJoinQuery(getAllTableName);
    console.log("Sqlquery", sqlCommand);
    const result: TableData = await window.electronAPI.getTable(sqlCommand);
    console.log("result", result);

    return result;
  }

  private constructJoinQuery(tableNames: string[]): string {
    const mainTable = "main_table";
    const joinConditions = tableNames
      .filter((tableName) => tableName !== mainTable)
      .map(
        (tableName) =>
          `LEFT JOIN ${tableName} ON ${mainTable}.id = ${tableName}.id`
      )
      .join(" ");

    return `SELECT * FROM ${mainTable} ${joinConditions} LIMIT 100;`;
  }
}

export default OneTableConverter;
