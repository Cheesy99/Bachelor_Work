import ConversionStrategy from "./Interface/ConversionStrategy";

class OneTableConverter implements ConversionStrategy {
  public async convert(data: TableData): Promise<TableData> {
    return await this.createOneTable(data);
  }

  private async createOneTable(data: TableData): Promise<TableData> {
    const newTable: TableData = { schema: data.schema, table: [] };
    const schemaCollectedForIndex: Set<number> = new Set();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, row] of data.table.entries()) {
      const insertRow = [];
      insertRow.push(row[0]);
      for (let index1 = 1; index1 < row.length; index1++) {
        const element = row[index1];
        if (typeof element === "number" && index1 !== 0) {
          const tableName = newTable.schema[index1];
          const foreignRow: (string | number)[] =
            await window.electronAPI.getRow(element, tableName);
          if (!schemaCollectedForIndex.has(index1)) {
            schemaCollectedForIndex.add(index1);
            const newSchema: string[] = await window.electronAPI.getTableSchema(
              tableName
            );
            const result = newSchema.filter((element) => element !== "id");
            newTable.schema.push(...result);
          }
          //Removing id of foreign table now need to also remove it in schema
          insertRow.push(...foreignRow);
        } else if (index1 !== 0) {
          insertRow.push(element);
        }
      }
      newTable.table.push(insertRow);
    }
    let newSchema = newTable.schema;
    // This will only work for one foreigntable needs to work for other to need to see where the other foreign table starts

    return { schema: newSchema, table: newTable.table };
  }
}

export default OneTableConverter;
