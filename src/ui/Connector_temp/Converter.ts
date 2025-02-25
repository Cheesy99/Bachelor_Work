import ConversionStrategy from "./Interface/ConversionStrategy";

class Converter {
  private strategy?: ConversionStrategy;

  public setStrategy(strategy: ConversionStrategy) {
    this.strategy = strategy;
  }

  public convertBackendData(tableObject: TableObject[]): Table {
    return this.strategy!.convert(tableObject);
  }
}

export default Converter;
