import ConversionStrategy from "./Interface/ConversionStrategy";
import { getMinMax, createJoinedSchemaName, removeId } from "./Utils";
class OneTableConverter implements ConversionStrategy {
  private foreignTables: TableData[] = [];
  //Collect all the foreignTable and create the schema and then add them to the table base on the id and the name
  //of the column which is there table name
  public async convert(
    dataStruct: TableStruct,
    dataTable: TableData
  ): Promise<TableData> {
    console.log("I have been called");
    return this.convertToOneTableView(dataStruct, dataTable);
  }

  private async convertToOneTableView(
    tableStruct: TableStruct,
    tableData: TableData
  ): Promise<TableData> {
    const result = tableData; // Create a copy of tableData
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
            if (!result.schema.includes(column)) {
              result.schema.push(column);
            }
          }

          // Merge the foreign table rows with the main table rows
          for (const rowIndex in tableResult.table) {
            const foreignRow = tableResult.table[rowIndex];
            result.table[rowIndex].push(...foreignRow);
          }
        }
      }
    }
    return result;
  }
}

export default OneTableConverter;
