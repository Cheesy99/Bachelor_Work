import ConversionStrategy from "./Interface/ConversionStrategy";
import { getMinMax, checkSchemaName } from "./Utils";
class OneTableConverter implements ConversionStrategy {
  async convert(data: TableStruct): Promise<TableData> {
    return this.convertToOneTableView(data);
  }

  private async convertToOneTableView(
    tableStruct: TableStruct‚
  ): Promise<TableData> {
    let schema: string[] = tableStruct.schema;
    let table: (string | number)[][] = tableStruct.table;
    for (const value of tableStruct.table) {
      table
      const row: (string | number )[] = [];
      for (const [index, column] of value.entries()) {
        if (Array.isArray(column)) {
          const tableName = tableStruct.schema[index];
          const from: FromId = getMinMax(column);
          const table: TableData = await window.electronAPI.getTableData(
            from,
            tableName
          );
          schema = checkSchemaName(schema, table.schema);

    };

    
  }
}

export default OneTableConverter;
