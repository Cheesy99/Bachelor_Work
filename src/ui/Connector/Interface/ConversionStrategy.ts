interface ConversionStrategy {
  convert(
    dataStruct: TableStruct,
    tableData?: TableData
  ): Promise<TableData | NestedTable>;
}

export default ConversionStrategy;
