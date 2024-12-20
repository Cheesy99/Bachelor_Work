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
  private observers: ((data: Table, tableType: string) => void)[] = [];
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
  // Stragtegy Pattern
  public async convert(
    tableData: TableData,
    tableView: ViewSetting
  ): Promise<Table> {
    if (this.viewSetting === ViewSetting.NESTEDTABLES)
      Adapter.converter.setStrategy(new NestedTableConverter());
    else Adapter.converter.setStrategy(new OneTableConverter());
    return await Adapter.converter.convert(tableData);
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
      const result = await this.convert(data, ViewSetting.NESTEDTABLES);
      if (this.setTableData) this.setTableData(result);
    } else {
      console.log("Database does not exist.");
    }
  }

  public setupDatabaseChangeListener() {
    window.electronAPI.onDatabaseChange(async (data: TableData) => {
      if (this.setTableData) {
        const convertedData = await this.convert(data, this.viewSetting);
        this.setTableData(convertedData);
      }
    });
  }

  public async getSchema(tableName: string): Promise<string[]> {
    const result = await window.electronAPI.getTableSchema(tableName);
    return result;
  }
}

export default Adapter;
