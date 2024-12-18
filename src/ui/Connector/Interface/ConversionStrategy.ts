import TableView from "./TableView";

interface ConversionStrategy {
  convert(data: TableData): TableData | TableView;
}

export default ConversionStrategy;
