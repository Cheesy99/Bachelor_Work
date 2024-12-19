import ConversionStrategy from "./Interface/ConversionStrategy";
import OneTableConverter from "./OneTableConverter";

class Converter {
  private strategy: ConversionStrategy;

  constructor() {
    this.strategy = new OneTableConverter();
  }

  public setStrategy(strategy: ConversionStrategy) {
    this.strategy = strategy;
  }

  public convert(data: TableData): Promise<TableView | TableData> {
    return this.strategy.convert(data);
  }

  // public convertToTableData(data: TableView): TableData{

  // }

  // public convertToTableView(data: TableData): TableView{

  // }
}

export default Converter;
