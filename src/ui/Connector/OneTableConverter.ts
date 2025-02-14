import ConversionStrategy from "./Interface/ConversionStrategy";

class OneTableConverter implements ConversionStrategy {
  public async convert(sqlCommand: string): Promise<TableData> {
    return await this.createOneTable(sqlCommand);
  }

  // Here we can check for lazy loading in order to keep application consistent
  private async createOneTable(sqlCommand: string): Promise<TableData> {
    const result: TableData = await window.electronAPI.getTable(sqlCommand);
    return result;
  }
}

export default OneTableConverter;
