import JsonObject from "../Interfaces/JsonObject.js";
import tableSchema from "../Interfaces/tableSchema.js";
class SqlTextGenerator {
  private foreignCurrentIndex: number = 0;
  private mainTableCurrentIndex: number = 0;
  public async createSqlTableText(
    jsonObjectArray: JsonObject[]
  ): Promise<string[]> {
    const returnCommandQueue: string[] = [];

    const sqlCommand = `INSERT INTO main_table (id ,${Object.keys(
      jsonObjectArray[0]
    ).join(", ")}) VALUES `;
    const mainTableValues: string[] = [];

    jsonObjectArray.forEach((jsonObject: JsonObject) => {
      const nestedColumnValue: {
        columnPosition: number;
        foreignKeys: number[];
      }[] = [];
      const columnValues: string[] = new Array(
        Object.keys(jsonObject).length // check here if the length of the array is long enough
      ).fill("");
      Object.keys(jsonObject).forEach(async (key, index) => {
        const value = jsonObject[key];
        if (Array.isArray(value)) {
          const command = await this.creatingInputTextForForeignTable(
            key,
            value
          );
          returnCommandQueue.push(command[0]);
          nestedColumnValue.push({
            columnPosition: index,
            foreignKeys: command[1],
          });
        } else {
          columnValues[index] = this.formatValue(value);
        }
      });

      columnValues.forEach((value) => {
        console.log("columnvalues", value);
      });
      // Create multiple rows for each element in nestedColumnValue
      // This will probably only work for jsonObject that only have one nested object

      //This is a good idea you probably need to make it in a new database but maybe not check that
      //ColumnValue array is large enought which it probably isn't
      // nestedColumnValue.forEach(nestedColumn => {
      //   const { columnPosition, foreignKeys } = nestedColumn;
      //   columnValues[columnPosition] = `nestedColumn_${columnPosition}`;
      //   foreignKeys.forEach(foreignKey => {
      //     columnValues.splice(columnPosition + 1, 0, `foreignKey_${foreignKey}`);
      //   });
      // });

      // mainTableValues.push(`(${this.mainTableCurrentIndex++}, ${columnValues.join(", ")})`);
    });

    return returnCommandQueue;
  }

  private async creatingInputTextForForeignTable(
    tableName: string,
    data: JsonObject[]
  ): Promise<[string, number[]]> {
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
      values = `${this.foreignCurrentIndex}, ${values}`;
      sqlCommand += `(${values}),`;
      const id = this.foreignCurrentIndex;
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
