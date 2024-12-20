import ConversionStrategy from "./Interface/ConversionStrategy";
import { getMinMax } from "./Utils";

class NestedTableConverter implements ConversionStrategy {
  public async convert(data: TableStruct): Promise<TableView> {
    const result = await this.convertToNestedView(data);
    console.log(result);
    return result;
  }

  private async convertToNestedView(
    tableStruct: TableStruct
  ): Promise<TableView> {
    const final = await this.convertToTableView(tableStruct);
    return final;
  }

  private async convertToTableView(
    tableStruct: TableStruct
  ): Promise<TableView> {
    console.log(tableStruct);
    const result: TableView = {
      schema: tableStruct.schema,
      table: [],
    };
    for (const value of tableStruct.table) {
      const row: (string | number | TableData)[] = [];
      for (const [index, column] of value.entries()) {
        if (Array.isArray(column)) {
          const tableName = tableStruct.schema[index];
          const from: FromId = getMinMax(column);
          const table: TableData = await window.electronAPI.getTableData(
            from,
            tableName
          );
          const createdTable: TableData = {
            schema: table.schema,
            table: table.table,
          };
          row.push(createdTable);
        } else {
          row.push(column);
        }
      }
      result.table.push(row);
    }
    return result;
  }
}

export default NestedTableConverter;
