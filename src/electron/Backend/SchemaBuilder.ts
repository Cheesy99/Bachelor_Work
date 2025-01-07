import TableSchema from "./Interfaces/TableSchema.js";
import JsonObject from "./Interfaces/JsonObject.js";
import SqlTextGenerator from "./SqlTextGenerator.js";
import DataCleaner from "./Utils/DataCleaner.js";
class SchemaBuilder {
  private sqlTextGenerator: SqlTextGenerator;

  public constructor(sqlTextGenerator: SqlTextGenerator) {
    this.sqlTextGenerator = sqlTextGenerator;
  }
  public generateSchemaText(tableSchema: TableSchema): string {
    return this.sqlTextGenerator.createSchemaText(tableSchema);
  }

  public generateSchemaWithCommand(json: JsonObject[]): {
    command: string[];
    tableSchema: TableSchema;
  } {
    const tableSchema = this.generateTableSchema(json);
    const command: string = this.generateSchemaText(tableSchema);
    return { command: DataCleaner.cleanSqlCommand(command), tableSchema };
  }

  public generateTableSchema(json: JsonObject[]): TableSchema {
    const result: TableSchema[] = [];
    if (Array.isArray(json)) {
      json.forEach((obj) =>
        result.push(...this.recursiveSchema(obj, "main_table"))
      );
    }
    return this.cleanData(result);
  }

  private recursiveSchema(
    json: JsonObject,
    tableName: string | number
  ): TableSchema[] {
    const keys = Object.keys(json);
    const result = [{ [tableName]: keys }];
    keys.forEach((key) => {
      if (Array.isArray(json[key])) {
        json[key].forEach((obj) => {
          result.push(...this.recursiveSchema(obj, key));
        });
      }
    });
    return result;
  }

  private cleanData(tableSchema: TableSchema[]): TableSchema {
    // Removes Duplicate object that are exactly the same
    this.removeDuplicates(tableSchema);

    //Here we need to make sure the we only have one table and all the columns types found for a
    //column are collected and are all add to the table

    const mergedSchema: { [key: string]: Set<string> } = {};

    tableSchema.forEach((schema) => {
      Object.keys(schema).forEach((key: string) => {
        if (!mergedSchema[key]) {
          mergedSchema[key] = new Set();
        }
        schema[key].forEach((value: string) => {
          mergedSchema[key].add(value);
        });
      });
    });

    const schemaArray = Object.keys(mergedSchema).map((key) => ({
      [key]: Array.from(mergedSchema[key]),
    }));

    return Object.assign({}, ...schemaArray);
  }

  private removeDuplicates(tableSchema: TableSchema[]): TableSchema[] {
    const seen = new Set();
    return tableSchema.filter((tableSchema) => {
      const jsonString = JSON.stringify(tableSchema);
      return seen.has(jsonString) ? false : seen.add(jsonString);
    });
  }
}
export default SchemaBuilder;
