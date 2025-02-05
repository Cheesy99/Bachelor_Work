import ConversionStrategy from "./Interface/ConversionStrategy";

class OneTableConverter implements ConversionStrategy {
  public async convert(data: TableData): Promise<TableData> {
    return await this.createOneTable(data);
  }

  private async createOneTable(data: TableData): Promise<TableData> {
    const newTable: TableData = { schema: ["id"], table: [] };
    const schemaCollectedForIndex: Set<number> = new Set();
    const schemaColumnToRemove: Set<string> = new Set();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, row] of data.table.entries()) {
      const insertRow = [];
      insertRow.push(row[0]);
      for (let index1 = 1; index1 < row.length; index1++) {
        const element = row[index1];
        const tableName: string = data.schema[index1];
        if (
          (typeof element === "number" && index1 !== 0) ||
          (element === null &&
            (await window.electronAPI.isForeignTable(tableName)))
        ) {
          if (!schemaCollectedForIndex.has(index1)) {
            schemaCollectedForIndex.add(index1);
            const newSchema: string[] = await window.electronAPI.getTableSchema(
              tableName
            );
            const result = newSchema.filter((element) => element !== "id");
            schemaColumnToRemove.add(tableName);
            newTable.schema.push(...result);
          }
          let foreignRow: (string | number)[];
          if (typeof element === "number") {
            foreignRow = await window.electronAPI.getRow(element, tableName);
            //Removing id of foreign table now need to also remove it in schema
            if (typeof foreignRow[0] === "number") foreignRow.splice(0, 1);
          } else {
            const schema: string[] = await window.electronAPI.getTableSchema(
              tableName
            );
            // because we ignore id column
            const columnLength = schema.length - 1;
            foreignRow = new Array(columnLength).fill(undefined);
          }
          insertRow.push(...foreignRow);
        } else if (index1 !== 0) {
          if (!schemaCollectedForIndex.has(index1)) {
            schemaCollectedForIndex.add(index1);
            newTable.schema.push(data.schema[index1]);
          }
          insertRow.push(element);
        }
      }
      newTable.table.push(insertRow);
    }

    return { schema: newTable.schema, table: newTable.table };
  }
}

export default OneTableConverter;
