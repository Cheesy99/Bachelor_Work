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

type TableObject = {
  key: any;
  value: string;
};

type FromId = {
  startId: number;
  endId: number;
};

interface Window {
  electronAPI: {
    sendJsonFile: (fileData: string) => Promise<string>;
    initTableData: () => Promise<void>;
    getTableSchema: (tableName: string) => Promise<string[]>;
    subscribeToListener: (
      callback: (TableObject: TableObject[]) => void
    ) => void;
    popStack: () => Promise<void>;
    executeSqlCommand: (command: string) => Promise<string>;
    databaseExists: () => Promise<boolean>;
    exportToExcel: () => Promise<void>;
    checkIfColumnIsTable: (tableName: string) => Promise<boolean>;
    getSaveResult: () => Promise<TableData | boolean>;
    cleanDatabase: () => Promise<void>;
    renameNamingColumn: (
      newColumnName: string,
      oldColumnName: string
    ) => Promise<void>;
    isForeignTable: (tableName: string) => Promise<boolean>;
    deleteColumn: (commandStack: string, columnName: string) => Promise<void>;
    getAllColumnValues: (columnName: string) => Promise<string[]>;
    getMaxRowValue: () => Promise<number>;
    hasStack: () => Promise<boolean>;
    getStack: () => Promise<string[]>;
    getAllTableName: () => Promise<string[]>;
    getTable: (command: string) => Promise<TableData>;
  };
}
