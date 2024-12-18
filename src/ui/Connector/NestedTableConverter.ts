import ConversionStrategy from "./Interface/ConversionStrategy";
import TableView from "./Interface/TableView";

class NestedTableConverter implements ConversionStrategy {
  private tableData?: TableData;
  convert(data: TableData): TableView {
    this.tableData = data;
    return this.convertNestedView(this.tableData.schema);
  }

  private convertNestedView(incomingSchema: string[]): TableView {
    const result: TableView = { schema: incomingSchema, table: [] };
    if (!this.tableData) {
      throw new Error("TableData is not initialized");
    }
    for (let rowIndex = 0; rowIndex < this.tableData.table.length; ++rowIndex) {
      let inputRow: (string | number | number[])[];
      let newIndex;
      this.tableData.table[rowIndex].forEach((value, columnIndex) => {
        if (columnIndex === 0) {
          inputRow.push(value);
        } else if (typeof value === "number") {
          let result = this.checkForDuplicateRow(
            [value],
            rowIndex,
            columnIndex,
            inputRow,
            this.tableData!.schema.at(columnIndex)
          );

          inputRow.push(result.listOfForeignKeys);
          newIndex = result.continueIndexFrom;
        } else inputRow.push(value);
      });
    }
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  private checkForDuplicateRow(
    foreignKeys: number[],
    currentRowIndex: number,
    currentColumnIndex: number,
    currentlyCollected: (string | number | number[])[],
    tableName: string | undefined
  ): { listOfForeignKeys: number[]; continueIndexFrom: number } {
    if (tableName) {
      throw Error("The schema value was not found for the tablename");
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
    if (this.compareRowsFromColumn(rowBelow, currentlyCollected, indexCol)) {
      const value = rowBelow.at(currentColumnIndex);
      if (typeof value === "number") {
        foreignKeys.push(value);
        this.checkForDuplicateRow(
          foreignKeys,
          index,
          currentColumnIndex,
          currentlyCollected,
          tableName
        );
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
    for (let i = startColumnIndex; i >= 0; i--) {
      const currentElement = currentRow[i];
      const compareElement = rowToCompare[i];

      if (Array.isArray(currentElement) && Array.isArray(compareElement)) {
        if (!this.areArraysEqual(currentElement, compareElement)) {
          return false;
        }
      } else if (currentElement !== compareElement) {
        return false;
      }
    }
    return true;
  }

  private areArraysEqual(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  }
}

export default NestedTableConverter;
