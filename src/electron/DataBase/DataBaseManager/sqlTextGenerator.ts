import DatabaseManager from "./dataBaseManager.js";
import JsonObject from "../Interfaces/JsonObject.js";
import tableSchema from "../Interfaces/tableSchema.js";
class SqlTextGenerator {
  private dataBaseManager;
  private foreignCurrentIndex: number = 0;
  private mainTableCurrentIndex: number = 0;
  constructor(dbManager: DatabaseManager) {
    this.dataBaseManager = dbManager;
  }
  public async createSqlTableText(
    jsonObjectArray: JsonObject[]
  ): Promise<string[]> {
    let returnCommandQueue: string[] = [];
    let sqlCommand = `INSERT INTO main_table (id ,${Object.keys(
      jsonObjectArray[0]
    ).join(", ")}) VALUES `;
    let mainTableValues: string[] = [];

    jsonObjectArray.forEach((jsonObject: JsonObject) => {
      let nestedColumnValue: {
        columnPosition: number;
        foreignKeys: number[];
      }[] = [];
      let columnValues: string[] = new Array(
        Object.keys(jsonObject).length
      ).fill("");
      Object.keys(jsonObject).forEach(async (key, index) => {
        console.log("keys", key);
        const value = jsonObject[key];
        if (Array.isArray(value)) {
          let command = await this.creatingInputTextForForeignTable(key, value);
          returnCommandQueue.push(command[0]);
          nestedColumnValue.push({
            columnPosition: index,
            foreignKeys: command[1],
          });
        } else {
          columnValues[index] = this.formatValue(value);
        }
      });

      // Create multiple rows for each element in nestedColumnValue
      // This will probably only work for jsonObject that only have one nested object
      let duplicatedRows: string[][] = [];
      nestedColumnValue.forEach((nestedColumn) => {
        nestedColumn.foreignKeys.forEach((foreignKey) => {
          let newRow = [...columnValues];
          newRow[nestedColumn.columnPosition] = `${foreignKey}`;
          duplicatedRows.push(newRow);
        });
      });

      // Flatten the 2D array and add it to returnCommandQueue with parentheses
      duplicatedRows.forEach((row) =>
        returnCommandQueue.push(`(${row.join(", ")})`)
      );
    });

    return returnCommandQueue;
  }

  private async creatingInputTextForForeignTable(
    tableName: string,
    data: JsonObject[]
  ): Promise<[string, number[]]> {
    let newIds: number[] = [];
    let sqlCommand: string = `INSERT INTO ${tableName} (id, ${Object.keys(
      data[0]
    )
      .map(this.cleanName)
      .join(", ")}) VALUES `;
    // TODO: Empty array could be a problem here example: "modulZuordnungen" : [ ],
    data.forEach((item, index) => {
      let values = Object.values(item)
        .map((value) => this.formatValue(value))
        .join(", ");
      values = `${this.foreignCurrentIndex}, ${values}`;
      sqlCommand += `(${values}),`;
      let id = this.foreignCurrentIndex;
      newIds.push(id);
      this.foreignCurrentIndex++;
    });

    sqlCommand = sqlCommand.slice(0, -1) + ";";

    return [sqlCommand, newIds];
  }
  private cleanName(name: string): string {
    return name.replace(/\s+/g, "").replace(/[^a-zA-Z0-9_]/g, "_");
  }

  private formatValue(value: any): string {
    if (typeof value === "string") {
      // Replace spaces and hyphens with underscores
      value = value.replace(/[\s-]/g, "_");
      return `'${value.replace(/'/g, "''")}'`;
    }
    return `${value}`;
  }

  public createSqlSchemaText(tables: tableSchema): string {
    let sql = "";

    if (tables["null"]) {
      sql += this.createSchemaText("main_table", tables["null"], tables);
    }

    Object.keys(tables).forEach((table) => {
      if (table !== "null") {
        sql += this.createSchemaText(table, tables[table], tables);
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

  private createSchemaText = (
    tableName: string,
    columns: string[],
    tables: tableSchema
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
