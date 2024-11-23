/* eslint-disable @typescript-eslint/no-explicit-any */
import sqlite3 from "sqlite3";
import * as path from "path";
import { fileURLToPath } from "url";
import { isDev } from "../../util.js";
import JsonObject from "../Interfaces/JsonObject.js";
import tableSchema from "../Interfaces/tableSchema.js";
import SqlTextGenerator from "./sqlTextGenerator.js";
import TableData from "../Interfaces/TableData.js";
class DatabaseManager {
  private static instance: DatabaseManager;
  private dataBase: sqlite3.Database;
  private dbPath: string;
  private sqlGen: SqlTextGenerator;

  private constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    this.dbPath = path.join(
      __dirname,
      isDev() ? "../../../" : "../../",
      "dataBase.db"
    );
    this.dataBase = new sqlite3.Database(this.dbPath);
    this.sqlGen = new SqlTextGenerator();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public schemaEntry(Schema: tableSchema): void {
    const organizedSchema = this.sqlGen.createSqlSchemaText(Schema);
    this.executeSqlCommands(organizedSchema);
  }

  public async insertData(jsonObject: JsonObject[]): Promise<number> {
    const insertDataCommands = await this.sqlGen.createSqlTableText(jsonObject);

    console.log(insertDataCommands);
    insertDataCommands
      .slice()
      .reverse()
      .forEach((command) => {
        this.executeSqlCommands(command);
      });
    return -1;
  }

  public async getTableData(
    fromID: [startingID: number, endingId: number],
    tableName: string
  ): Promise<TableData> {
    const [startID, endID] = fromID;
    const schemaQuery = `PRAGMA table_info(${tableName})`;
    const dataQuery = `SELECT * FROM ${tableName} WHERE id BETWEEN ${startID} AND ${endID}`;

    const schemaResult = await this.executeSqlGetData(schemaQuery);
    const dataResult = await this.executeSqlGetData(dataQuery);

    const schema = schemaResult.map((row: any) => row.name);
    const rows = dataResult.map((row: any) => Object.values(row));

    return { schema, rows };
  }

  public executeSqlCommands(sqlCommand: string): void {
    const commands: string[] = sqlCommand
      .split(";\n")
      .filter((cmd) => cmd.trim() !== "");

    this.dataBase.serialize(() => {
      this.dataBase.run("BEGIN TRANSACTION");
      commands.forEach((command) => {
        this.dataBase.run(command, (err) => {
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

  public executeSqlWithReponse(sqlCommand: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.dataBase.get(sqlCommand, (err, row) => {
        if (err) {
          console.error("Error executing SQL command:", err.message, err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  public executeSqlGetData(sqlCommand: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.dataBase.all(sqlCommand, (err, rows) => {
        if (err) {
          console.error("Error executing SQL command:", err.message, err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}
export default DatabaseManager;
