import ConversionStrategy from "./Interface/ConversionStrategy";
import NestedTableConverter from "./NestedTableConverter";
import OneTableConverter from "./OneTableConverter";
import { areArraysEqual, getMinMax } from "./Utils";

class Converter {
  private strategy?: ConversionStrategy;

  public setStrategy(strategy: ConversionStrategy) {
    this.strategy = strategy;
  }

  public convert(data: TableData): Promise<Table> {
    const tableStruct = this.createTableStruct(data);
    if (this.strategy instanceof NestedTableConverter) {
      return this.strategy.convert(tableStruct);
    }
    return this.strategy!.convert(tableStruct, data);
  }

  private createTableStruct(data: TableData): TableStruct {
    const resultTable: (string | number | number[])[][] = [];
    const result: TableStruct = { schema: data.schema, table: [] };
    if (!data) {
      throw new Error("TableData is not initialized");
    }
    for (let rowIndex = 0; rowIndex < data.table.length; ++rowIndex) {
      let inputRow: (string | number | number[])[] = [];
      data.table[rowIndex].forEach((value, columnIndex) => {
        if (columnIndex === 0) {
          inputRow.push(value);
        } else if (typeof value === "number") {
          let result = this.checkForDuplicateRow(
            data,
            [value],
            rowIndex,
            columnIndex,
            inputRow,
            data!.schema[columnIndex]
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
    data: TableData,
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
    if (index >= data!.table.length)
      return {
        listOfForeignKeys: foreignKeys,
        continueIndexFrom: currentRowIndex,
      };
    let rowBelow: (string | number | number[])[] = data?.table.at(++index)!;
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
          data,
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
  // This is Wrong
  public convertNestedToTableData(table: NestedTable): Promise<Table> {
    this.setStrategy(new OneTableConverter());
    const result: TableData = {
      schema: table.schema,
      table: [],
    };

    for (const row of table.table) {
      let newRows: (string | number)[][] = [[]];

      for (const [index, column] of row.entries()) {
        if (
          typeof column === "object" &&
          column !== null &&
          "schema" in column &&
          "table" in column
        ) {
          const nestedTableData = column as TableData;
          const idIndex = nestedTableData.schema.indexOf("id");
          if (idIndex === -1) continue;

          const ids = nestedTableData.table.map(
            (nestedRow) => nestedRow[idIndex]
          );
          const newRowsWithIds: (string | number)[][] = [];

          for (const id of ids) {
            for (const newRow of newRows) {
              const newRowCopy = [...newRow];
              newRowCopy[index] = id;
              newRowsWithIds.push(newRowCopy);
            }
          }

          newRows = newRowsWithIds;
        } else {
          for (const newRow of newRows) {
            newRow[index] = column;
          }
        }
      }

      result.table.push(...newRows);
    }

    return this.convert(result);
  }

  public convertOneToNested(table: TableData): Promise<Table> {
    this.setStrategy(new NestedTableConverter());
    const filteredSchema = table.schema.filter(
      (column) => !column.includes(".")
    );

    const indicesToKeep: number[] = table.schema
      .map((column, index) => (!column.includes(".") ? index : -1))
      .filter((index) => index !== -1);

    // Filter the table data to keep only the columns that do not contain a dot (.)
    const filteredTable: (string | number)[][] = table.table.map((row) =>
      indicesToKeep.map((index) => row[index])
    );

    let result: TableData = {
      schema: filteredSchema,
      table: filteredTable,
    };

    return this.convert(result);
  }
}

export default Converter;
