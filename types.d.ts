type Table = TableData | NestedTable;

type TableData = {
  schema: string[];
  table: (string | number)[][];
};

type TableStruct = {
  schema: string[];
  table: (string | number | number[])[][];
};

type NestedTable = {
  schema: string[];
  table: (string | number | TableData)[][];
};

type FromId = {
  startId: number;
  endId: number;
};

interface Window {
  electronAPI: {
    sendJsonFile: (fileData: string) => Promise<void>;
    getNestedTableData: (
      fromID: FromId,
      tableName: string
    ) => Promise<TableData>;
    getTableData: (fromID: FromId, tableName: string) => Promise<void>;
    getTableSchema: (tableName: string) => Promise<string[]>;
    getRow: (id: number, tableName: string) => Promise<(string | number)[]>;
    subscribeToListener: (callback: (tableData: TableData) => void) => void;
    sendSqlCommand: (sqlCommand: string, tableName: string) => Promise<void>;
    databaseExists: () => Promise<boolean>;
    exportToExcel: (result: TableData) => void;
    checkIfColumnIsTable: (tableName: string) => Promise<boolean>;
    howManyRows: (tableName: string) => Promise<number>;
    saveResult: (tableData: TableData) => Promise<void>;
    getSaveResult: () => Promise<TableData | boolean>;
    // insertUsingWorkerNodes: (fileData: string) => Promise<void>;
  };
}
