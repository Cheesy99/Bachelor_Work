import Converter from "./Converter";
import NestedTableConverter from "./NestedTableConverter";
import OneTableConverter from "./OneTableConverter";
import { translateUmlauts } from "./Utils";
import { ViewSetting } from "./Enum/Setting";
import React from "react";

class UiManager {
  private converter: Converter;
  private readonly setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  private setTableData: React.Dispatch<
    React.SetStateAction<Table | null>
  > | null;
  private readonly tableType: ViewSetting;

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
    window.electronAPI.subscribeToListener(async (tableData: TableData) => {
      if (this.setTableData) {
        sessionStorage.setItem("TableData", JSON.stringify(tableData));
        this.setTableData(await this.convert(this.tableType));
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
      };
      reader.readAsText(file);
    } else {
      alert("Invalid file type. Please select a .json file.");
    }
  }

  public async getTableData(from: FromId, tableName: string) {
    await window.electronAPI.getTableData(from, tableName);
  }

  public async getInitTableData() {
    const databaseExists = await window.electronAPI.databaseExists();
    if (databaseExists && this.setTableData) {
      const from: FromId = { startId: 0, endId: 100 };
      await window.electronAPI.getTableData(from, "main_table");
    }
  }

  public async convert(tableView: ViewSetting): Promise<Table> {
    const table = sessionStorage.getItem("TableData");
    const result: TableData = JSON.parse(table!);
    this.setStrategyByViewSetting(tableView);
    return await this.converter.convertBackendData(result);
  }

  public async getSchema(tableName: string): Promise<string[]> {
    return await window.electronAPI.getTableSchema(tableName);
  }

  private setStrategyByViewSetting(viewSetting: ViewSetting) {
    if (viewSetting === ViewSetting.NESTEDTABLES) {
      this.converter.setStrategy(new NestedTableConverter());
    } else {
      this.converter.setStrategy(new OneTableConverter());
    }
  }
}

export default UiManager;
