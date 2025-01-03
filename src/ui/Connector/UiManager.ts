import Converter from "./Converter";
import NestedTableConverter from "./NestedTableConverter";
import OneTableConverter from "./OneTableConverter";
import { translateUmlauts } from "./Utils";
import { ViewSetting } from "./Enum/Setting";
class UiManager {
  private static instance: UiManager;
  private static converter: Converter;
  private setTableData: React.Dispatch<
    React.SetStateAction<Table | null>
  > | null = null;
  public static getInstance(): UiManager {
    if (!UiManager.instance) {
      UiManager.instance = new UiManager(new Converter());
    }
    return UiManager.instance;
  }

  private constructor(converter: Converter) {
    UiManager.converter = converter;
  }

  async insertJsonData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const fileSize = file?.size;

    if (file) {
      const databaseExists = await window.electronAPI.databaseExists();
      if (databaseExists) {
        alert("Database already exists.");
        return;
      }
      const reader = new FileReader();
      fileSize !== undefined && fileSize > 3 * 1024 * 1024;
      if (true) {
        console.log("File size is larger than 3 MB. Inserting into web nodes.");

        reader.onload = async () => {
          let fileData = reader.result as string;
          fileData = translateUmlauts(fileData);
          await window.electronAPI.insertUsingWorkerNodes(fileData);
        };
        reader.readAsText(file);
        return;
      }

      //   reader.onload = () => {
      //     let fileData = reader.result as string;
      //     fileData = translateUmlauts(fileData);
      //     window.electronAPI.sendJsonFile(fileData);
      //   };
      //   reader.readAsText(file);
      // } else {
      //   alert("Invalid file type. Please select a .json file.");
    }
  }

  // Stragtegy Pattern
  public async convert(
    tableData: TableData,
    tableView: ViewSetting
  ): Promise<Table> {
    UiManager.setStrategyByViewSetting(tableView);
    return await UiManager.converter.convert(tableData);
  }

  public setTableDataSetter(
    setter: React.Dispatch<React.SetStateAction<Table | null>>
  ): this {
    this.setTableData = setter;
    return this;
  }

  public async checkDatabaseAndFetchData(tableView: ViewSetting) {
    const databaseExists = await window.electronAPI.databaseExists();
    if (databaseExists) {
      const fromID: FromId = { startId: 1, endId: 100 };
      const data: TableData = await window.electronAPI.getTableData(
        fromID,
        "main_table"
      );
      const result = await this.convert(data, tableView);
      if (this.setTableData) this.setTableData(result);
    } else {
      console.log("Database does not exist.");
    }
  }

  public static async convertNestedToOne(table: NestedTable): Promise<Table> {
    let result = this.converter.convertNestedToTableData(table);
    console.log("I am confused", result);
    return result;
  }

  public static async convertOneToNested(table: TableData): Promise<Table> {
    return this.converter.convertOneToNested(table);
  }

  public setupDatabaseChangeListener(viewSetting: ViewSetting) {
    window.electronAPI.onDatabaseChange(async (data: TableData) => {
      if (this.setTableData) {
        const convertedData = await this.convert(data, viewSetting);
        this.setTableData(convertedData);
      }
    });
  }

  public async getSchema(tableName: string): Promise<string[]> {
    const result = await window.electronAPI.getTableSchema(tableName);
    return result;
  }

  public static setStrategyByViewSetting(viewSetting: ViewSetting) {
    if (viewSetting === ViewSetting.NESTEDTABLES) {
      UiManager.converter.setStrategy(new NestedTableConverter());
    } else {
      UiManager.converter.setStrategy(new OneTableConverter());
    }
  }
}

export default UiManager;
