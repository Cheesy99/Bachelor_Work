import Adapter from "./Adapter";
import ConversionStrategy from "./Interface/ConversionStrategy";
import { areArraysEqual, getMinMax } from "./Utils";
type TableStruct = {
  schema: string[];
  table: (string | number | number[])[][];
};
class NestedTableConverter implements ConversionStrategy {
  private tableData?: TableData;
  public async convert(data: TableData): Promise<TableView> {
    this.tableData = data;
    const result = await this.convertNestedView(this.tableData.schema);
    console.log(result);
    return result;
  }

  private async convertNestedView(
    incomingSchema: string[]
  ): Promise<TableView> {
    const resultTable: (string | number | number[])[][] = [];
    const result: TableStruct = { schema: incomingSchema, table: [] };
    if (!this.tableData) {
      throw new Error("TableData is not initialized");
    }
    for (let rowIndex = 0; rowIndex < this.tableData.table.length; ++rowIndex) {
      let inputRow: (string | number | number[])[] = [];
      this.tableData.table[rowIndex].forEach((value, columnIndex) => {
        if (columnIndex === 0) {
          inputRow.push(value);
        } else if (typeof value === "number") {
          let result = this.checkForDuplicateRow(
            [value],
            rowIndex,
            columnIndex,
            inputRow,
            this.tableData!.schema[columnIndex]
          );

          inputRow.push(result.listOfForeignKeys);
          rowIndex = result.continueIndexFrom;
        } else inputRow.push(value);
      });
      resultTable.push(inputRow);
    }
    result.table = resultTable;
    const final = await this.convertToTableView(result);
    return final;
  }

  private checkForDuplicateRow(
    foreignKeys: number[],
    currentRowIndex: number,
    currentColumnIndex: number,
    currentlyCollected: (string | number | number[])[],
    tableName: string
  ): { listOfForeignKeys: number[]; continueIndexFrom: number } {
    if (!tableName) {
      throw new Error("The schema value was not found for the tablename");
    }
    let index = currentRowIndex;
    if (index >= this.tableData!.table.length)
      return {
        listOfForeignKeys: foreignKeys,
        continueIndexFrom: currentRowIndex,
      };
    let rowBelow: (string | number | number[])[] = this.tableData?.table.at(
      ++index
    )!;
    let indexCol: number = currentColumnIndex - 1;
    const isRowEqual = this.compareRowsFromColumn(
      rowBelow,
      currentlyCollected,
      indexCol
    );

    if (isRowEqual) {
      const value = rowBelow.at(currentColumnIndex);
      if (typeof value === "number") {
        foreignKeys.push(value);
        const result = this.checkForDuplicateRow(
          foreignKeys,
          index,
          currentColumnIndex,
          currentlyCollected,
          tableName
        );
        return {
          listOfForeignKeys: result.listOfForeignKeys,
          continueIndexFrom: result.continueIndexFrom,
        };
      } else throw new Error("Table Schema Value inconsistent");
    }
    return {
      listOfForeignKeys: foreignKeys,
      continueIndexFrom: currentRowIndex,
    };
  }

  private compareRowsFromColumn(
    currentRow: (string | number | number[])[],
    rowToCompare: (string | number | number[])[],
    startColumnIndex: number
  ): boolean {
    if (!currentRow || !rowToCompare) {
      return false;
    }

    for (let i = startColumnIndex; i >= 1; i--) {
      const currentElement = currentRow[i];
      const compareElement = rowToCompare[i];

      if (Array.isArray(currentElement) && Array.isArray(compareElement)) {
        if (!areArraysEqual(currentElement, compareElement)) {
          return false;
        }
      } else if (currentElement !== compareElement) {
        return false;
      }
    }
    return true;
  }

  private async convertToTableView(
    tableStruct: TableStruct
  ): Promise<TableView> {
    const result: TableView = {
      type: "TableView",
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
