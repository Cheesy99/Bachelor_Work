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
  public async convert(dataStruct: TableStruct): Promise<TableData> {
    return [];
  }

  private async findForeignTable(tableStruct: TableStruct): Promise<void> {
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
            tableStruct.schema,
            tableName,
            tableResult.schema
          );

          // Update the schema with the new columns from the foreign table
          for (const column of schemaResult) {
            if (!tableStruct.schema.includes(column)) {
              tableStruct.schema.push(column);
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
