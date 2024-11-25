import JsonObject from "../Interfaces/JsonObject.js";
import tableSchema from "../Interfaces/tableSchema.js";
class SqlTextGenerator {
  private foreignCurrentIndex: number = 0;
  private mainTableCurrentIndex: number = 0;
  public createSqlTableText(jsonObjectArray: JsonObject[]): string[] {
    const returnCommandQueue: string[] = [];

    let sqlCommand: string = `INSERT INTO main_table (id ,${Object.keys(
      jsonObjectArray[0]
    ).join(", ")}) VALUES `;
    const mainTableFinalEntries: string[][] = [];
    const tableValues: string[][] = Array.from(
      { length: jsonObjectArray.length },
      () => Array(Object.keys(jsonObjectArray[0]).length).fill("")
    );
    jsonObjectArray.map((jsonObject: JsonObject, outerIndex: number) => {
      const nestedValue: {
        rowPosition: number;
        columnPosition: number;
        foreignKeys: number[];
      }[] = [];
      const promises = Object.keys(jsonObject).map((key, innerIndex) => {
        const value = jsonObject[key];
        if (Array.isArray(value) || typeof value === "object") {
          const command = this.creatingInputTextForForeignTable(key, value);
          returnCommandQueue.push(command[0]);
          nestedValue.push({
            rowPosition: outerIndex,
            columnPosition: innerIndex,
            foreignKeys: command[1],
          });
          tableValues[outerIndex][innerIndex] = "x";
        } else {
          tableValues[outerIndex][innerIndex] = this.formatValue(value);
        }
      });

      tableValues.forEach((row, rowIndex) => {
        nestedValue.forEach((nestedValues, index) => {
          if (rowIndex === nestedValues.rowPosition) {
            nestedValues.foreignKeys.forEach((foreignKey, index) => {
              let rowDuplicate = [...row];
              rowDuplicate[nestedValues.columnPosition] = foreignKey.toString();
              mainTableFinalEntries.push(rowDuplicate);
            });
          }
        });
      });
    });

    mainTableFinalEntries.forEach((entryRow) => {
      const values = entryRow.map((value) => value).join(", ");
      sqlCommand += `(${++this.mainTableCurrentIndex}, ${values}) ,`;
    });

    sqlCommand = sqlCommand.slice(0, -1) + ";";
    returnCommandQueue.push(sqlCommand);

    return returnCommandQueue;
  }

  private creatingInputTextForForeignTable(
    tableName: string,
    data: JsonObject[]
  ): [string, number[]] {
    const newIds: number[] = [];
    let sqlCommand: string = `INSERT INTO ${tableName} (id, ${Object.keys(
      data[0]
    )
      .map(this.cleanName)
      .join(", ")}) VALUES `;
    // TODO: Empty array could be a problem here example: "modulZuordnungen" : [ ],
    data.forEach((item) => {
      let values = Object.values(item)
        .map((value) => this.formatValue(value))
        .join(", ");
      values = `${++this.foreignCurrentIndex}, ${values}`;
      sqlCommand += `(${values}),`;
      newIds.push(this.foreignCurrentIndex);
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
