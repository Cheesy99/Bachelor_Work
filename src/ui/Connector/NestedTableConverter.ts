import ConversionStrategy from "./Interface/ConversionStrategy";
import { getMinMax } from "./Utils";

class NestedTableConverter implements ConversionStrategy {
  public async convert(sqlCommand: string): Promise<NestedTable> {
    return await this.convertToNestedTable(sqlCommand);
  }

  private async convertToNestedTable(sqlCommand: string): Promise<NestedTable> {
    return { schema: [], table: [] };
  }
}

export default NestedTableConverter;
