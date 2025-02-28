import sqlite3 from "sqlite3";
import * as path from "path";
import { fileURLToPath } from "url";
import { isDev } from "../util.js";
import { Readable } from "stream";
import fs from "fs";
import { app } from "electron";

class DataBaseConnector {
  private static instance: DataBaseConnector;
  private dataBase: sqlite3.Database;
  private readonly dbPath: string;
  public static getInstance(): DataBaseConnector {
    if (!DataBaseConnector.instance) {
      DataBaseConnector.instance = new DataBaseConnector();
    }

    return DataBaseConnector.instance;
  }
  private constructor() {
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = path.dirname(__filename);
    // For development envirnoment
    // this.dbPath = path.join(
    //   __dirname,
    //   isDev() ? "../../" : "../",
    //   "dataBase.db"
    // );
    // this.dataBase = new sqlite3.Database(this.dbPath);
    // FOR PRODUCTION BUILD
    const userDataPath = app.getPath("userData");
    this.dbPath = path.join(userDataPath, "dataBase.db");
    this.dataBase = new sqlite3.Database(this.dbPath);
  }

  public async closeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dataBase.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async deleteDatabase() {
    try {
      await this.closeDatabase();
      fs.unlinkSync(this.dbPath);
      console.log("Database file deleted successfully.");
    } catch (error) {
      console.error("Error deleting the database file:", error);
      throw new Error("Failed to delete the database file.");
    }
  }

  public async recreateDatabase(): Promise<void> {
    try {
      await this.deleteDatabase();
      this.dataBase = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Error creating new database:", err);
        } else {
          console.log("New database created successfully.");
        }
      });
    } catch (error) {
      console.error("Error recreating the database:", error);
      throw new Error("Failed to recreate the database.");
    }
  }

  public databaseExists(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`;
      this.dataBase.get(query, (err, row) => {
        if (err) {
          console.error(
            "Error checking if database has tables:",
            err.message,
            err
          );
          reject(err);
        } else {
          resolve((row as { count: number }).count > 0);
        }
      });
    });
  }

  public sqlCommandWithResponse(sqlCommand: any): Promise<any[]> {
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

  public sqlCommand(sqlCommand: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dataBase.serialize(() => {
        this.dataBase.run("BEGIN TRANSACTION");

        const stream = Readable.from(sqlCommand);
        stream.on("data", (command) => {
          this.dataBase.run(command, (err) => {
            if (err) {
              console.error(err.message, command);
              reject(err);
              process.exit(1);
            } else {
              console.log("SQL command executed successfully.");
            }
          });
        });

        stream.on("end", () => {
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

        stream.on("error", (err) => {
          console.error("Error reading stream:", err.message, err);
          reject(err);
        });
      });
    });
  }

  public sqlCommandWithIdResponse(sqlCommand: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.dataBase.run(sqlCommand, function (err) {
        if (err) {
          console.error("Error executing SQL command:", err.message, err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }
}

export default DataBaseConnector;
