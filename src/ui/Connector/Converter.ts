import ConversionStrategy from "./Interface/ConversionStrategy";
import OneTableConverter from "./OneTableConverter";
import { areArraysEqual, getMinMax } from "./Utils";

class Converter {
  private strategy: ConversionStrategy;
  private tableData?: TableData;
  constructor() {
    this.strategy = new OneTableConverter();
  }

  public setStrategy(strategy: ConversionStrategy) {
    this.strategy = strategy;
  }

  public convert(data: TableData): Promise<Table> {
    const tableStruct = this.createTableStruct(data);
    return this.strategy.convert(tableStruct);
  }

  private createTableStruct(data: Table): TableStruct {
    const resultTable: (string | number | number[])[][] = [];
    const result: TableStruct = { schema: data.schema, table: [] };
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
    return result;
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
}

export default Converter;
