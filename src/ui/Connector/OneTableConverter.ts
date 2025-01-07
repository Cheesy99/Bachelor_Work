import ConversionStrategy from "./Interface/ConversionStrategy";

class OneTableConverter implements ConversionStrategy {
  public async convert(data: TableData): Promise<TableData> {
    console.log("being called");
    return await this.createOneTable(data);
  }

  private async createOneTable(data: TableData): Promise<TableData> {
    const newTable: TableData = { schema: data.schema, table: [] };
    const schemaCollectedForIndex: Set<number> = new Set();
    for (const [index, row] of data.table.entries()) {
      const insertRow = [];
      insertRow.push(row[0]);
      for (let index1 = 1; index1 < row.length; index1++) {
        const element = row[index1];
        if (typeof element === "number" && index1 !== 0) {
          const foreignRow: (string | number)[] =
            await window.electronAPI.getRow(element, newTable.schema[index1]);
          if (!schemaCollectedForIndex.has(index1)) {
            console.log("I was called");
            schemaCollectedForIndex.add(index1);
            let newSchema: string[] = await window.electronAPI.getTableSchema(
              newTable.schema[index1]
            );
            const result = newSchema.filter((element) => element !== "id");
            newTable.schema.push(...result);
          }
          insertRow.push(...foreignRow);
        } else if (index1 !== 0) {
          insertRow.push(element);
        }
      }
      newTable.table.push(insertRow);
    }
    return newTable;
  }
}

export default OneTableConverter;
