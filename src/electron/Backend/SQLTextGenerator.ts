import TableData from "./Interfaces/TableData.js";
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
    let tableSQL = `CREATE TABLE ${tableName} (\n  id INTEGER PRIMARY KEY ,\n`;

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

  public createInputDataText(tableData: TableData[]): string[] {
    const returnCommandQueue: string[] = [];
    tableData.reverse().forEach((tableData) => {
      let key = Object.keys(tableData.schema)[0];
      let sqlCommand: string = `INSERT INTO ${key} (${tableData.schema[
        key
      ].join(", ")}) VALUES `;

      tableData.table.forEach((row) => {
        const escapedRow = row.map((value) =>
          typeof value === "string" ? `'${value.replace(/'/g, "''")}'` : value
        );
        sqlCommand += `( ${escapedRow.join(", ")} ),`;
      });

      sqlCommand = sqlCommand.slice(0, -1) + ";";
      returnCommandQueue.push(sqlCommand);
    });
    return returnCommandQueue;
  }
}

export default SqlTextGenerator;
