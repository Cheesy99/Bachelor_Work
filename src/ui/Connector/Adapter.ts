import TableView from "./Interface/TableView";
import Converter from "./Converter";
import NestedTableConverter from "./NestedTableConverter";
import OneTableConverter from "./OneTableConverter";
import { translateUmlauts } from "./Utils";
class Adapter {
  private static instance: Adapter;
  private static converter: Converter;
  private setTableData: React.Dispatch<
    React.SetStateAction<Table | null>
  > | null = null;

  public static getInstance(): Adapter {
    if (!Adapter.instance) {
      Adapter.instance = new Adapter(new Converter());
    }
    return Adapter.instance;
  }

  private constructor(converter: Converter) {
    Adapter.converter = converter;
  }

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
        fileData = translateUmlauts(fileData);
        window.electronAPI.sendJsonFile(fileData);
      };
      reader.readAsText(file);
    } else {
      alert("Invalid file type. Please select a .json file.");
    }
  }

  async getData(
    fromID: FromId,
    tableName: string,
    tableView: ViewSetting
  ): Promise<TableView | TableData> {
    const tableDataCollection: TableData =
      await window.electronAPI.getTableData(fromID, tableName);
    if (tableView === ViewSetting.NESTEDTABLES)
      Adapter.converter.setStrategy(new NestedTableConverter());
    else Adapter.converter.setStrategy(new OneTableConverter());
    return Adapter.converter.convert(tableDataCollection);
  }

  public setTableDataSetter(
    setter: React.Dispatch<React.SetStateAction<Table | null>>
  ): this {
    this.setTableData = setter;
    return this;
  }

  public async checkDatabaseAndFetchData() {
    const databaseExists = await window.electronAPI.databaseExists();
    if (databaseExists) {
      const fromID: FromId = { startId: 1, endId: 100 };
      const data: Table = await window.electronAPI.getTableData(
        fromID,
        "main_table"
      );
      if (this.setTableData) this.setTableData(data);
    } else {
      console.log("Database does not exist.");
    }
  }

  public setupDatabaseChangeListener() {
    window.electronAPI.onDatabaseChange((data: TableData) => {
      if (this.setTableData) {
        this.setTableData(data);
      }
    });
  }
}

export default Adapter;
