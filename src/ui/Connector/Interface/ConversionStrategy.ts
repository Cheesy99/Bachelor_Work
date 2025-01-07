interface ConversionStrategy {
  convert(data: TableData): Promise<TableData | NestedTable>;
}

export default ConversionStrategy;
