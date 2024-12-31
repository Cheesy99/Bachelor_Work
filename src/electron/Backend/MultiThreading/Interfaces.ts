import TableDataBackend from "../Interfaces/TableData.js";
import TableSchema from "../Interfaces/TableSchema.js";

export interface Task {
  type: Type;
  payload: string | { payload: string; schema: TableSchema };
}

export interface Parcel {
  type: Type;
  payload: TableSchema | TableDataBackend[];
}

export enum Type {
  schema,
  table,
}
