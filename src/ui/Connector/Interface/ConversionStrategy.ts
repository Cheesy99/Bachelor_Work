interface ConversionStrategy {
  convert(dataStruct: TableStruct): Promise<TableData | NestedTable>;
}

export default ConversionStrategy;
