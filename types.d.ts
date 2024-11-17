type TableData = {
  schema: string[];
  rows: any[][];
};

interface Window {
  electronAPI: {
    sendJsonFile: (fileData: string) => void;
    getTableData: (
      fromID: [startId: number, endId: number],
      tableName: string
    ) => Promise<TableData>;
    onDatabaseChange: (callback: (amountOfRows: number) => void) => void;
  };
}
