type Table = TableData | NestedTable;

type TableData = {
  schema: string[];
  table: (string | number)[][];
};

type TreeNode = {
  name: string;
  children?: TreeNode[];
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
    sendJsonFile: (fileData: string) => Promise<string>;
    getNestedTableData: (
      fromID: FromId,
      tableName: string
    ) => Promise<TableData>;
    getTableData: (fromID: FromId, tableName: string) => Promise<void>;
    getTableSchema: (tableName: string) => Promise<string[]>;
    getRow: (id: number, tableName: string) => Promise<(string | number)[]>;
    subscribeToListener: (
      callback: (tableData: TableData, fromDisk: boolean) => void
    ) => void;
    executeSqlCommandStack: (
      sqlCommand: any,
      tableName: string
    ) => Promise<string>;
    databaseExists: () => Promise<boolean>;
    exportToExcel: () => Promise<void>;
    checkIfColumnIsTable: (tableName: string) => Promise<boolean>;
    howManyRows: (tableName: string) => Promise<number>;
    saveResult: (tableData: TableData) => Promise<void>;
    getSaveResult: () => Promise<TableData | boolean>;
    cleanDatabase: () => Promise<void>;
    // insertUsingWorkerNodes: (fileData: string) => Promise<void>;
  };
}
