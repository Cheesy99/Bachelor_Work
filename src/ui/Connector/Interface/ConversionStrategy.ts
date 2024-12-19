interface ConversionStrategy {
  convert(data: TableData): Promise<TableData | TableView>;
}

export default ConversionStrategy;
