interface ConversionStrategy {
  convert(
    dataStruct: TableStruct,
    tableData?: TableData
  ): Promise<TableData | TableView>;
}

export default ConversionStrategy;
