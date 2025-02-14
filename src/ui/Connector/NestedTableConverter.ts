import ConversionStrategy from "./Interface/ConversionStrategy";
import { getMinMax } from "./Utils";

class NestedTableConverter implements ConversionStrategy {
  public convert(tableObject: TableObject[]): NestedTable {
    return this.convertToNestedTable(tableObject);
  }

  private convertToNestedTable(tableObject: TableObject[]): NestedTable {
    return { schema: [], table: [] };
  }
}

export default NestedTableConverter;
