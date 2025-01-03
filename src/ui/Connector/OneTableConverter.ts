import ConversionStrategy from "./Interface/ConversionStrategy";
import { getMinMax, createJoinedSchemaName, removeId } from "./Utils";
class OneTableConverter implements ConversionStrategy {
  private foreignTables: {
    tableName: string;
    table: (string | number)[][];
  }[] = [];
  private index: number = 0;
  //Collect all the foreignTable and create the schema and then add them to the table base on the id and the name
  //of the column which is there table name
  public async convert(
    dataStruct: TableStruct,
    dataTable: TableData
  ): Promise<TableData> {
    await this.findForeignTable(dataStruct, dataTable);
    return this.createTable(dataTable);
  }

  private createTable(tableData: TableData): TableData {
    let result: TableData = tableData;

    for (const foreignTable of this.foreignTables) {
      const columnIndex = tableData.schema.indexOf(foreignTable.tableName);
      if (columnIndex === -1) continue;

      const foreignTableData = foreignTable.table;
      for (const foreignRow of foreignTableData) {
        const foreignId = foreignRow[0];
        const foreignValues = foreignRow.slice(1);

        for (const mainRow of result.table) {
          if (mainRow[columnIndex] === foreignId) {
            mainRow.push(...foreignValues);
          }
        }
      }
    }
    return result;
  }

  private async findForeignTable(
    tableStruct: TableStruct,
    tableData: TableData
  ): Promise<void> {
    for (const value of tableStruct.table) {
      for (const [index, entry] of value.entries()) {
        if (Array.isArray(entry)) {
          const tableName = tableStruct.schema[index];
          const from: FromId = getMinMax(entry);
          const tableResult: TableData = await window.electronAPI.getTableData(
            from,
            tableName
          );
          let schemaResult = createJoinedSchemaName(
            tableData.schema,
            tableName,
            tableResult.schema
          );

          // Update the schema with the new columns from the foreign table
          for (const column of schemaResult) {
            if (!tableData.schema.includes(column)) {
              tableData.schema.push(column);
            }
          }
          if (!this.foreignTables[this.index]) {
            this.foreignTables[this.index] = { tableName: "", table: [] };
          }

          this.foreignTables[this.index].tableName = tableName;
          this.foreignTables[this.index].table.push(...tableResult.table);
        }
      }
    }
  }
}

export default OneTableConverter;
