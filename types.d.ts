type TableData = {
  schema: string[];
  table: (string | number)[][];
};

type FromId = {
  startId: number;
  endId: number;
};

interface Window {
  electronAPI: {
    sendJsonFile: (fileData: string) => void;
    getTableData: (fromID: FromId, tableName: string) => Promise<TableData>;
    onDatabaseChange: (callback) => void;
    sendSqlCommand: (sqlCommand: string, tableName: string) => void;
    databaseExists: () => Promise<boolean>;
  };
}
