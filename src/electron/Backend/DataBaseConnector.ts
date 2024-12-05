import sqlite3 from "sqlite3";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { isDev } from "../util.js";

class DataBaseConnector {
  private static instance: DataBaseConnector;
  private dataBase: sqlite3.Database;
  private dbPath: string;
  public static getInstance(): DataBaseConnector {
    if (!DataBaseConnector.instance) {
      DataBaseConnector.instance = new DataBaseConnector();
    }

    return DataBaseConnector.instance;
  }
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

  public databaseExists(): boolean {
    return fs.existsSync(this.dbPath);
  }

  public sqlCommandWithReponse(sqlCommand: string): Promise<any[]> {
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

  public sqlCommand(sqlCommand: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dataBase.serialize(() => {
        this.dataBase.run("BEGIN TRANSACTION");
        sqlCommand.forEach((command) => {
          this.dataBase.run(command, (err) => {
            if (err) {
              console.error("Error executing SQL command:", err.message, err);
              reject(err);
              process.exit(1);
            } else {
              console.log("SQL command executed successfully.");
            }
          });
        });

        this.dataBase.run("COMMIT", (err) => {
          if (err) {
            console.error("Error committing transaction:", err.message, err);
            reject(err);
            process.exit(1);
          } else {
            resolve();
          }
        });
      });
    });
  }
}

export default DataBaseConnector;
