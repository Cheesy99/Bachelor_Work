import TableView from "./Interface_Enum/TableView";

class Adapter {
  private static instance: Adapter;

  public static getInstance(): Adapter {
    if (!Adapter.instance) {
      Adapter.instance = new Adapter();
    }
    return Adapter.instance;
  }

  private constructor() {}

  async updateData(newData: TableData): Promise<void> {}

  async insertJsonData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      const databaseExists = await window.electronAPI.databaseExists();
      if (databaseExists) {
        alert("Database already exists.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        let fileData = reader.result as string;
        fileData = this.translateUmlauts(fileData);
        window.electronAPI.sendJsonFile(fileData);
      };
      reader.readAsText(file);
    } else {
      alert("Invalid file type. Please select a .json file.");
    }
  }

  async getData(fromID: FromId, tableName: string): Promise<TableView> {
    const tableDataCollection: TableData[] = [];
    tableDataCollection[0] = await window.electronAPI.getTableData(
      fromID,
      tableName
    );
    const foreignKeyToCollection: number[] = [];
  }

  private recursiveInsert(schema: string[]) {}

  translateUmlauts(text: string): string {
    return text
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/Ä/g, "Ae")
      .replace(/Ö/g, "Oe")
      .replace(/Ü/g, "Ue")
      .replace(/ß/g, "ss");
  }
}

export default Adapter;
