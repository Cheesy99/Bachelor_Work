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

  public async insertData(
    jsonObject: JsonObject,
    jsonSchemas: FieldNames[]
  ): Promise<number> {
    this.db.schemaEntry(this.convertDataToTableSchema(jsonSchemas));
    let number_of_rows = await this.db.insertData(jsonObject);
    return number_of_rows;
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
