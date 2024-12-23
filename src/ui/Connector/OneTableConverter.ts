import ConversionStrategy from "./Interface/ConversionStrategy";
import { getMinMax, createJoinedSchemaName, removeId } from "./Utils";
class OneTableConverter implements ConversionStrategy {
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
    const result = tableData;
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

          for (const column of schemaResult) {
            if (!result.schema.includes(column)) {
              result.schema.push(column);
            }
          }

          for (const row of tableResult.table) {
            row.shift();
            result.table[index].push(...row);
          }
        }
      }
    }
    return result;
  }
}

export default OneTableConverter;
