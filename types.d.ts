type Table = TableData | TableView;

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
    getTableSchema: (tableName: string) => Promise<string[]>;
    getRow: (id: number, tableName: string) => Promise<(string | number)[]>;
    onDatabaseChange: (callback) => void;
    sendSqlCommand: (
      sqlCommand: string,
      tableName: string
    ) => Promise<(string | number)[][]>;
    databaseExists: () => Promise<boolean>;
    exportToExcel: (result: TableData) => void;
    checkIfColumnIsTable: (tableName: string) => Promise<boolean>;
    howManyRows: (tableName: string) => Promise<number>;
    saveResult: (tableData: TableData) => Promise<void>;
    getSaveResult: () => Promise<TableData | boolean>;
  };
}
