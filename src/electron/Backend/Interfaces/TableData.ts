import TableSchema from "./TableSchema.js";

interface TableData {
  schema: TableSchema;
  table: string | number[][];
}

export default TableData;
