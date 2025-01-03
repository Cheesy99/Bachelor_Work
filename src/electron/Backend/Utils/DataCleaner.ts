import TableDataBackend from "../Interfaces/TableData.js";
import TableSchema from "../Interfaces/TableSchema.js";

class DataCleaner {
  public static cleanName(name: string): string {
    return name.replace(/\s+/g, "").replace(/[^a-zA-Z0-9_]/g, "_");
  }

  public static formatValue(value: any): string {
    if (typeof value === "string") {
      // Replace spaces and hyphens with underscores
      value = value.replace(/[\s-]/g, "_");
      return `'${value.replace(/'/g, "''")}'`;
    }
    return `${value}`;
  }

  public static foreignKeySorter = (a: string, b: string): number => {
    if (a.includes("FOREIGN") && !b.includes("FOREIGN")) {
      return 1;
    } else if (!a.includes("FOREIGN") && b.includes("FOREIGN")) {
      return -1;
    } else {
      return 0;
    }
  };
  public static cleanSqlCommand(command: string): string[] {
    return command.split(";\n").filter((cmd) => cmd.trim() !== "");
  }

  public static mergeSchemas = (schemas: TableSchema[]): TableSchema => {
    const result: TableSchema = {};
    schemas.forEach((schema, _) => {
      Object.entries(schema).forEach(([key, value]) => {
        if (!result[key]) {
          result[key] = [];
        }
        result[key] = Array.from(new Set([...result[key], ...value]));
      });
    });

    return result;
  };

  static mergeTables = (
    tableDataCollector: TableDataBackend[][]
  ): TableDataBackend[] => {
    const schema: TableSchema[] = tableDataCollector
      .map((tableDataArray) =>
        tableDataArray.map((tableData) => tableData.schema)
      )
      .flat();

    let tablesSchema: TableSchema = this.mergeSchemas(schema);
    const newTable: TableDataBackend[] = new Array(
      Object.keys(tablesSchema).length
    ).fill({ schema: {} });

    Object.keys(tablesSchema).forEach((key, index) => {
      newTable[index].schema = { [key]: tablesSchema[key] };
    });

    tableDataCollector.forEach((tableDataArray: TableDataBackend[]) => {
      tableDataArray.forEach((tableData: TableDataBackend) => {
        Object.keys(tableData.schema).forEach((key) => {
          const index = Object.keys(tablesSchema).indexOf(key);
          if (index !== -1) {
            const cleanedRows = tableData.table.map((row) => {
              if (typeof row === "object" && row !== null) {
                return this.cleanRow(row, tablesSchema[key]);
              } else {
                console.error(`Invalid row structure: ${JSON.stringify(row)}`);
                return null;
              }
            });
            newTable[index].table = (newTable[index].table || [])
              .concat
              // cleanedRows
              ();
          }
        });
      });
    });

    console.log("table big size", newTable.length);
    return newTable;
  };

  private static cleanRow(
    row: (string | number)[],
    schema: string[]
  ): (string | number)[] {
    // const cleanedRow: (string | number)[] = {};
    // schema.forEach((column: any) => {
    //   cleanedRow[column as string] = row[column] !== undefined ? row[column] : null;
    // });
    return [];
  }
}

export default DataCleaner;
