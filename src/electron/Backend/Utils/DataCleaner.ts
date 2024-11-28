class DataCleaner {
  public static cleanName(name: string): string {
    return name.replace(/\s+/g, "").replace(/[^a-zA-Z0-9_]/g, "_");
  }
}

export default DataCleaner;
