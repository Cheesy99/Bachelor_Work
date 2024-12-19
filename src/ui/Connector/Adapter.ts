import Converter from "./Converter";
import NestedTableConverter from "./NestedTableConverter";
import OneTableConverter from "./OneTableConverter";
import { translateUmlauts } from "./Utils";
import { ViewSetting } from "./Enum/Setting";
class Adapter {
  private static instance: Adapter;
  private static converter: Converter;
  private setTableData: React.Dispatch<
    React.SetStateAction<Table | null>
  > | null = null;
  private viewSetting: ViewSetting = ViewSetting.NESTEDTABLES;

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

  public setViewSetting(viewSetting: ViewSetting): void {
    this.viewSetting = viewSetting;
  }

  public convert(tableData: TableData, tableView: ViewSetting): Table {
    if (this.viewSetting === ViewSetting.NESTEDTABLES)
      Adapter.converter.setStrategy(new NestedTableConverter());
    else Adapter.converter.setStrategy(new OneTableConverter());
    return Adapter.converter.convert(tableData);
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
      const data: TableData = await window.electronAPI.getTableData(
        fromID,
        "main_table"
      );
      this.convert(data, ViewSetting.NESTEDTABLES);
      if (this.setTableData) this.setTableData(data);
    } else {
      console.log("Database does not exist.");
    }
  }

  public setupDatabaseChangeListener() {
    window.electronAPI.onDatabaseChange((data: TableData) => {
      if (this.setTableData) {
        const convertedData = this.convert(data, this.viewSetting);
        this.setTableData(data);
      }
    });
  }

  public async getSchema(tableName: string): Promise<string[]> {
    const result = await window.electronAPI.getTableSchema(tableName);
    return result;
  }
}

export default Adapter;
