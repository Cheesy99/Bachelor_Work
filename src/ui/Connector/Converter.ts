import ConversionStrategy from "./Interface/ConversionStrategy";

class Converter {
  private strategy?: ConversionStrategy;

  public setStrategy(strategy: ConversionStrategy) {
    this.strategy = strategy;
  }

  public async convertBackendData(sqlCommand: string): Promise<Table> {
    return await this.strategy!.convert(sqlCommand);
  }
}

export default Converter;
