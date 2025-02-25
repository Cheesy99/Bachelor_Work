import ConversionStrategy from "./Interface/ConversionStrategy";

class OneTableConverter implements ConversionStrategy {
  public convert(tableObject: TableObject[]): TableData {
    return this.createOneTable(tableObject);
  }

  private createOneTable(tableObject: TableObject[]): TableData {
    const schema: string[] = Object.keys(tableObject[0]);
    const table: (string | number)[][] = tableObject.map((row: any) => {
      const rowData: (string | number)[] = [];
      schema.forEach((key) => {
        rowData.push(row[key]);
      });
      return rowData;
    });
    return { schema: schema, table: table };
  }
}

export default OneTableConverter;
