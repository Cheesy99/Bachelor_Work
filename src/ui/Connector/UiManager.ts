import Converter from "./Converter";
import NestedTableConverter from "./NestedTableConverter";
import OneTableConverter from "./OneTableConverter";
import { translateUmlauts } from "./Utils";
import { ViewSetting } from "./Enum/Setting";
class UiManager {
  private converter: Converter;
  private setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  private setTableData: React.Dispatch<
    React.SetStateAction<Table | null>
  > | null;
  private tableType: ViewSetting;

  public constructor(
    converter: Converter,
    tableRef: React.Dispatch<React.SetStateAction<Table | null>> | null,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    tableType: ViewSetting
  ) {
    this.converter = converter;
    this.setTableData = tableRef;
    this.setLoading = setLoading;
    this.tableType = tableType;
    window.electronAPI.subscribeToListener((tableData: TableData) => {
      if (this.setTableData) {
        this.setTableData(tableData);
      }
    });
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

      reader.onload = async () => {
        this.setLoading(true);
        let fileData = reader.result as string;
        fileData = translateUmlauts(fileData);
        await window.electronAPI.sendJsonFile(fileData);
        this.setLoading(false);
        // this.checkDatabaseAndFetchData(this.tableType);
      };
      reader.readAsText(file);
    } else {
      alert("Invalid file type. Please select a .json file.");
    }
  }

  // Stragtegy Pattern
  public async convert(
    tableData: TableData,
    tableView: ViewSetting
  ): Promise<Table> {
    this.setStrategyByViewSetting(tableView);
    return await this.converter.convert(tableData);
  }

  public setTableDataSetter(
    setter: React.Dispatch<React.SetStateAction<Table | null>>
  ): this {
    this.setTableData = setter;
    return this;
  }

  // public async checkDatabaseAndFetchData(tableView: ViewSetting) {
  //   const databaseExists = await window.electronAPI.databaseExists();
  //   if (databaseExists) {
  //     const fromID: FromId = { startId: 1, endId: 100 };
  //     const data: TableData = await window.electronAPI.getTableData(
  //       fromID,
  //       "main_table"
  //     );
  //     const result = await this.convert(data, tableView);
  //     if (this.setTableData) this.setTableData(result);
  //   } else {
  //     console.log("Database does not exist.");
  //   }
  // }

  public async convertNestedToOne(table: NestedTable): Promise<Table> {
    let result = this.converter.convertNestedToTableData(table);
    console.log("I am confused", result);
    return result;
  }

  public async convertOneToNested(table: TableData): Promise<Table> {
    return this.converter.convertOneToNested(table);
  }

  public async getSchema(tableName: string): Promise<string[]> {
    const result = await window.electronAPI.getTableSchema(tableName);
    return result;
  }

  public setStrategyByViewSetting(viewSetting: ViewSetting) {
    if (viewSetting === ViewSetting.NESTEDTABLES) {
      this.converter.setStrategy(new NestedTableConverter());
    } else {
      this.converter.setStrategy(new OneTableConverter());
    }
  }
}

export default UiManager;
