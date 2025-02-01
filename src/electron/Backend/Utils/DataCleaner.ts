import TableDataBackend from "../Interfaces/TableData.js";
import TableSchema from "../Interfaces/TableSchema.js";

class DataCleaner {
  public static cleanName(name: string): string {
    return name
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .replace(/(\w+)\s*-\s*(\w+)/g, "$1$2")
      .replace(/-\s*/g, "")
      .replace(/\.\s*/g, "")
      .replace(/\//g, "");
  }

  public static formatValue(value: any): string {
    if (typeof value === "string") {
      // Replace spaces and hyphens with underscores
      value = value.replace(/[\s-]/g, "");
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

  public schemaSqlPrinter = (schemaArray: string[]): string => {
    let result = "(";
    let shemaString = schemaArray.join(", ");
    return result.concat(shemaString).concat(")");
  };
}

export default DataCleaner;
