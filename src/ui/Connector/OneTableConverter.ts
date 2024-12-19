import ConversionStrategy from "./Interface/ConversionStrategy";

class OneTableConverter implements ConversionStrategy {
  async convert(data: TableData): Promise<TableData> {
    throw new Error("Method not implemented.");
  }
}

export default OneTableConverter;
