interface ConversionStrategy {
  convert(sqlCommand: string): Promise<TableData | NestedTable>;
}

export default ConversionStrategy;
