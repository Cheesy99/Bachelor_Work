import ConversionStrategy from "./Interface/ConversionStrategy";
import { getMinMax } from "./Utils";

class NestedTableConverter implements ConversionStrategy {
  public async convert(data: TableData): Promise<NestedTable> {
    const tableStruct = this.createTableStruct(data);
    const result = await this.convertToNestedView(tableStruct);
    return result;
  }

  private createTableStruct(data: TableData): TableStruct {
    const result: TableStruct = { schema: data.schema, table: [] };
    if (!data) {
      throw new Error("TableData is not initialized");
    }

    for (let i = 0; i < data.table.length; i++) {
      const collectionRowWithId: (string | number[] | number)[] = [];
      let row = data.table[i];
      let id: number = row[0] as number;
      //Starting at one to jump over id
      for (let k = 1; k < row.length; k++) {
        let value = row[k];

        if (typeof value === "number") {
          collectionRowWithId.push([value]);
        } else if (typeof value === "string") collectionRowWithId.push(value);
      }

      for (let j = i + 1; j < data.table.length; j++) {
        let deleteThisRow = true;
        let rowToCheck: (string | number)[] = data.table[j];
        //Starting at one to jump over id
        for (let index = 1; index < rowToCheck.length; index++) {
          let valueToCheck = rowToCheck[index];
          if (typeof valueToCheck === "string") {
            if (valueToCheck !== row[index]) {
              deleteThisRow = false;
              break;
            }
          } else if (typeof valueToCheck === "number") {
            (collectionRowWithId[index - 1] as number[]).push(valueToCheck);
          }
        }
        //remove loop as it is a duplicate of another
        if (deleteThisRow) {
          data.table.splice(j, 1);
          j--; // Adjust the index to account for the removed row
        }
      }
      collectionRowWithId.unshift(id);
      result.table.push(collectionRowWithId);
    }

    return result;
  }

  private async convertToNestedView(
    tableStruct: TableStruct
  ): Promise<NestedTable> {
    console.log(tableStruct);
    const final = await this.convertToTableView(tableStruct);
    return final;
  }

  private async convertToTableView(
    tableStruct: TableStruct
  ): Promise<NestedTable> {
    const result: NestedTable = {
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
