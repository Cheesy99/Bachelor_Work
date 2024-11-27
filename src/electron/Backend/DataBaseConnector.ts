class DataBaseConnector {
  private static instance: DataBaseConnector;
  public static getInstance(): DataBaseConnector {
    if (!DataBaseConnector.getInstance) {
      DataBaseConnector.instance = new DataBaseConnector();
    }

    return DataBaseConnector.instance;
  }
}

export default DataBaseConnector;
