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
}

export default DataCleaner;
