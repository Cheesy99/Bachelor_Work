import TableSchema from "./Interfaces/TableSchema.js";
import DataCleaner from "./Utils/DataCleaner.js";
class SqlTextGenerator {
  public createSchemaText(tableSchema: TableSchema): string {
    let sql = "";
    Object.keys(tableSchema).forEach((tableName) => {
      sql += this.schemaTextGenerator(tableName, tableSchema);
    });

    return sql;
  }

  private schemaTextGenerator = (tableName: string, tables: TableSchema) => {
    let stack: string[] = [];
    let tableSQL = `CREATE TABLE ${tableName} (\n  ${tableName}_id INTEGER PRIMARY KEY AUTOINCREMENT ,\n`;
    const tableValues = tables[tableName];
    tableValues.forEach((column) => {
      if (tables[column]) {
        stack.push(`  ${column} INTEGER,\n`);
        stack.push(
          `  FOREIGN KEY (${column}) REFERENCES ${column}(${column}_id),\n`
        );
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
