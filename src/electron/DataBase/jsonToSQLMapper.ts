import DatabaseManager from "./dataBaseManager.js";
import FieldNames from "./Interfaces/fieldNames.js";
import Schema from "./Interfaces/fieldNames.js";
import JsonObject from "./Interfaces/JsonObject.js";
import tableSchema from "./Interfaces/tableSchema.js";

export class JsonToSqlMapper {
  private db;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  public insertData(jsonObject: JsonObject, jsonSchemas: FieldNames[]) {
    this.db.schemaEntry(this.convertDataToTableSchema(jsonSchemas));
    this.db.insertData(jsonObject);
  }

  private convertDataToTableSchema(data: FieldNames[]): tableSchema {
    const tables: tableSchema = {};

    data.forEach((item) => {
      const parent = this.cleanName(item.parent || "null");
      const key = this.cleanName(item.key);
      if (!tables[parent]) {
        tables[parent] = [];
      }
      tables[parent].push(key);
    });
    return tables;
  }

  private cleanName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }
}

export default JsonToSqlMapper;
