import ConversionStrategy from "./Interface/ConversionStrategy";

class Converter {
  private strategy?: ConversionStrategy;

  public setStrategy(strategy: ConversionStrategy) {
    this.strategy = strategy;
  }

  public async convertBackendData(data: TableData): Promise<Table> {
    return await this.strategy!.convert(data);
  }
}

export default Converter;
