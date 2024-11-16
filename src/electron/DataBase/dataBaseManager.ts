import sqlite3 from "sqlite3";
import * as path from "path";
import { fileURLToPath } from "url";
import { isDev } from "../util.js";
import Schema from "./Interfaces/fieldNames.js";
import FieldNames from "./Interfaces/fieldNames.js";
import JsonObject from "./Interfaces/JsonObject.js";
import tableSchema from "./Interfaces/tableSchema.js";
type NumberRow = { id: number };
class DatabaseManager {
  private static instance: DatabaseManager;
  private dataBase: sqlite3.Database;
  private dbPath: string;

  private constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    this.dbPath = path.join(
      __dirname,
      isDev() ? "../../" : "../",
      "dataBase.db"
    );
    this.dataBase = new sqlite3.Database(this.dbPath);
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public schemaEntry(Schema: tableSchema): void {
    const organizedSchema = this.generateSQLTables(Schema);
    this.executeSqlCommands(organizedSchema);
  }

  public async insertData(jsonObject: JsonObject): Promise<number> {
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
        let sqlCommand = `INSERT INTO main_table (${columnNames}) VALUES `;

        sqlCommand += valuesArray.join(", ");
        sqlCommand += ";";

        await this.executeSqlCommands(sqlCommand);
      } else {
        //There is a base value to add it just that the value of termin are null!!!
        // console.log("DEBUG!!!", baseValues);
        console.error("No values to insert into main_table.");
      }
    }
    return this.executeSqlWithReponse(
      `SELECT COUNT(*) AS row_count FROM main_table`
    );
  }

  private generateSQLTables(tables: tableSchema): string {
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
    // if (tableName === "main_table") {
    // tableSQL = `CREATE TABLE ${tableName} (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n`;
    // } else {
    // tableSQL = `CREATE TABLE ${tableName} (\n  id INTEGER PRIMARY,\n`;
    // }

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

  // Here I need to work on assigning the foreign keys myself so that, once they have been entred I can give them to the main sql
  // so the query knows to fill in the write values
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
    startingId = await this.fetchLastInsertedId();
    this.executeSqlCommands(sqlCommand);
    endingId = await this.fetchLastInsertedId();

    return [++startingId, endingId];
  }

  private async fetchLastInsertedId(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.dataBase.get("SELECT last_insert_rowid() as id", (err, row) => {
        if (err) {
          console.error("Error fetching last insert row id:", err);
          reject(err);
          return;
        }
        try {
          // console.debug(
          // `DEBUG!!! fetchLastInsertedId row: ${JSON.stringify(row)}`
          // );
          const returnId = (row as NumberRow).id;
          resolve(returnId);
        } catch (err) {
          console.error("Unexpected result format:", err);
          reject(new Error("Unexpected result format"));
        }
      });
    });
  }

  private executeSqlCommands(sqlCommand: string): void {
    const commands: string[] = sqlCommand
      .split(";\n")
      .filter((cmd) => cmd.trim() !== "");

    this.dataBase.serialize(() => {
      this.dataBase.run("BEGIN TRANSACTION");
      commands.forEach((command) => {
        this.dataBase.run(command, (err) => {
          // console.log("Executing SQL command:", command);
          if (err) {
            console.error("Error executing SQL command:", err.message, err);
          } else {
            console.log("SQL command executed successfully.");
          }
        });
      });

      this.dataBase.run("COMMIT");
    });
  }

  private executeSqlWithReponse(sqlCommand: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.dataBase.get(sqlCommand, (err, row) => {
        if (err) {
          console.error("Error executing SQL command:", err.message, err);
          reject(err);
        } else {
          const result = row ? Object.values(row)[0] : 0;
          resolve(result);
        }
      });
    });
  }

  private cleanName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }
}
export default DatabaseManager;
