interface ConversionStrategy {
  convert(data: TableStruct): Promise<TableData | TableView>;
}

export default ConversionStrategy;
