import ConversionStrategy from "./Interface/ConversionStrategy";
import TableView from "./Interface/TableView";

class OneTableConverter implements ConversionStrategy {
  convert(data: TableData): TableData {
    throw new Error("Method not implemented.");
  }
}

export default OneTableConverter;
