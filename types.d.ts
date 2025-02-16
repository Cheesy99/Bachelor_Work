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
    subscribeToListener: (
      callback: (TableObject: TableObject[]) => void
    ) => void;
    undo: () => Promise<string>;
    reset: () => Promise<string>;
    executeSqlCommand: (command: string) => Promise<string>;
    databaseExists: () => Promise<boolean>;
    exportToExcel: () => Promise<void>;
    cleanDatabase: () => Promise<void>;
    renameNamingColumn: (
      newColumnName: string,
      oldColumnName: string
    ) => Promise<void>;
    isForeignTable: (tableName: string) => Promise<boolean>;
    getAllColumnValues: (columnName: string) => Promise<string[]>;
    getMaxRowValue: () => Promise<number>;
    getLastCommand: () => Promise<string>;
    getAllTableName: () => Promise<string[]>;
    getTable: (command: string) => Promise<TableData>;
  };
}
