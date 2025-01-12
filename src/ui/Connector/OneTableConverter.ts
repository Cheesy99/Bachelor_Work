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
          const foreignRow: (string | number)[] =
            await window.electronAPI.getRow(element, newTable.schema[index1]);
          if (!schemaCollectedForIndex.has(index1)) {
            schemaCollectedForIndex.add(index1);
            const newSchema: string[] = await window.electronAPI.getTableSchema(
              newTable.schema[index1]
            );
            const result = newSchema.filter((element) => element !== "id");
            newTable.schema.push(...result);
          }
          //Removing id of foreign table now need to also remove it in schema
          foreignRow.splice(0, 1);
          insertRow.push(...foreignRow);
        } else if (index1 !== 0) {
          insertRow.push(element);
        }
      }
      newTable.table.push(insertRow);
    }
    const newSchema = newTable.schema;
    // This will only work for one foreigntable needs to work for other to need to see where the other foreign table starts
    schemaCollectedForIndex.forEach((value: number) => {
      let appendValue = `${newSchema.at(value)}.`;
      newSchema.forEach((literalValue: string, index) => {
        if (value < index) newSchema[index] = appendValue + literalValue;
      });
      newSchema.splice(value, 1);
    });

    return { schema: newSchema, table: newTable.table };
  }
}

export default OneTableConverter;
