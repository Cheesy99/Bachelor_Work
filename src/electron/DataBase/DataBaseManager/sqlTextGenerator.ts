import DatabaseManager from "./dataBaseManager.js";
import JsonObject from "../Interfaces/JsonObject.js";
import tableSchema from "../Interfaces/tableSchema.js";
class SqlTextGenerator {
  private dataBaseManager;
  constructor(dbManager: DatabaseManager) {
    this.dataBaseManager = dbManager;
  }
  public async createSqlTableText(jsonObject: JsonObject): Promise<string> {
    let sqlCommand = "";
    console.log("Size of object", jsonObject.length);
    for (let i = 0; i < jsonObject.length; ++i) {
      let insertSQL = jsonObject[i];
      const columns = Object.keys(insertSQL);
      const columnNames = columns
        .map((column) => `"${this.cleanName(column.replace(/\s+/g, ""))}"`)
        .join(", ");

      let valuesArray = [];
      let baseValues = "";
      for (const key of columns) {
        if (!Array.isArray(insertSQL[key])) {
          baseValues += `'${insertSQL[key]}', `;
        }
      }

      // Remove the trailing comma and space from baseValues
      baseValues = baseValues.slice(0, -2);

      for (const key of columns) {
        if (Array.isArray(insertSQL[key])) {
          let idForForeignTable = await this.insertIntoForeignTable(
            key,
            insertSQL[key]
          );
          if (idForForeignTable.length > 0) {
            for (let i = idForForeignTable[0]; i <= idForForeignTable[1]; i++) {
              valuesArray.push(`(${baseValues}, ${i})`);
            }
          } else {
            valuesArray.push(`(${baseValues}, NULL)`);
          }
        }
      }

      if (valuesArray.length === 0) {
        valuesArray.push(`(${baseValues}, NULL)`);
      }

      if (valuesArray.length > 0) {
        sqlCommand = `INSERT INTO main_table (${columnNames}) VALUES `;

        sqlCommand += valuesArray.join(", ");
        sqlCommand += ";";
      } else {
        //There is a base value to add it just that the value of termin are null!!!
        throw new Error("No values to insert into main_table");
      }
    }

    return sqlCommand;
  }

  private async insertIntoForeignTable(
    tableName: string,
    data: any[]
  ): Promise<[number, number]> {
    let startingId: number;
    let endingId: number;
    if (data.length === 0) return [-1, -1];

    const columns = Object.keys(data[0]);
    const columnNames = columns
      .map((column) => `"${this.cleanName(column.replace(/\s+/g, ""))}"`)
      .join(", ");
    let sqlCommand = `INSERT INTO ${tableName} (${columnNames}) VALUES `;

    const values = data
      .map((row) => {
        const rowValues = columns
          .map((column) => `'${row[column]}'`)
          .join(", ");
        return `(${rowValues})`;
      })
      .join(",\n");
    sqlCommand += values + ";";
    let startingRow = await this.dataBaseManager.executeSqlWithReponse(
      "SELECT last_insert_rowid() as id"
    );
    this.dataBaseManager.executeSqlCommands(sqlCommand);
    let endingRow = await this.dataBaseManager.executeSqlWithReponse(
      "SELECT last_insert_rowid() as id"
    );
    startingId = startingRow.id;
    endingId = endingRow.id;
    return [++startingId, endingId];
  }

  private cleanName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }

  public createSqlSchemaText(tables: tableSchema): string {
    let sql = "";

    if (tables["null"]) {
      sql += this.createTableSQL("main_table", tables["null"], tables);
    }

    Object.keys(tables).forEach((table) => {
      if (table !== "null") {
        sql += this.createTableSQL(table, tables[table], tables);
      }
    });

    return sql;
  }

  private foreignKeySorter = (a: string, b: string): number => {
    if (a.includes("FOREIGN") && !b.includes("FOREIGN")) {
      return 1;
    } else if (!a.includes("FOREIGN") && b.includes("FOREIGN")) {
      return -1;
    } else {
      return 0;
    }
  };

  private createTableSQL = (
    tableName: string,
    columns: string[],
    tables: tableSchema
  ) => {
    let stack: string[] = [];
    let tableSQL = `CREATE TABLE ${tableName} (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;

    columns.forEach((column) => {
      if (tables[column]) {
        stack.push(`  ${column} INTEGER,\n`);
        stack.push(`  FOREIGN KEY (${column}) REFERENCES termine(id),\n`);
      } else {
        tableSQL += `  ${column} VARCHAR(255),\n`;
      }
    });
    tableSQL = tableSQL.slice(0, -2);

    stack.sort(this.foreignKeySorter);

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
