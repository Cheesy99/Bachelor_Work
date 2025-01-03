import TableDataBackend from "./Interfaces/TableData.js";
import TableSchema from "./Interfaces/TableSchema.js";
import DataCleaner from "./Utils/DataCleaner.js";
class SqlTextGenerator {
  public createSchemaText(tableSchema: TableSchema): string {
    let sql = "";
    Object.keys(tableSchema).forEach((columnName) => {
      sql += this.schemaTextGenerator(
        columnName,
        tableSchema[columnName],
        tableSchema
      );
    });

    return sql;
  }

  private schemaTextGenerator = (
    tableName: string,
    columns: string[],
    tables: TableSchema
  ) => {
    let stack: string[] = [];
    let tableSQL = `CREATE TABLE ${tableName} (\n  id INTEGER PRIMARY KEY AUTOINCREMENT ,\n`;

    columns.forEach((column) => {
      if (tables[column]) {
        stack.push(`  ${column} INTEGER,\n`);
        stack.push(`  FOREIGN KEY (${column}) REFERENCES ${column}(id),\n`);
      } else {
        tableSQL += `  ${column} VARCHAR(255),\n`;
      }
    });
    tableSQL = tableSQL.slice(0, -2);

    stack.sort(DataCleaner.foreignKeySorter);

    if (stack.length > 0) {
      tableSQL += `,\n` + stack.join("");
      stack = [];
      tableSQL = tableSQL.slice(0, -2);
    }

    tableSQL += `\n);\n\n`;
    return tableSQL;
  };
}

export default SqlTextGenerator;
