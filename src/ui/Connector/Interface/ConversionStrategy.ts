interface ConversionStrategy {
  convert(tableObject: TableObject[]): TableData | NestedTable;
}

export default ConversionStrategy;
