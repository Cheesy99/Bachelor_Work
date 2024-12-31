import TableSchema from "./TableSchema.js";

interface TableDataBackend {
  schema: TableSchema;
  table: (string | number)[][];
}

export default TableDataBackend;
