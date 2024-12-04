type TableData = {
  schema: string[];
  rows: (string | number)[][];
};

interface Window {
  electronAPI: {
    sendJsonFile: (fileData: string) => void;
    getTableData: (
      fromID: [startId: number, endId: number],
      tableName: string
    ) => Promise<TableData>;
    onDatabaseChange: (callback) => void;
  };
}
