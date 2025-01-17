import Converter from "./Converter";
import NestedTableConverter from "./NestedTableConverter";
import OneTableConverter from "./OneTableConverter";
import { translateUmlauts, createSqlQuery } from "./Utils";
import { ViewSetting } from "./Enum/Setting";
import React from "react";

class UiManager {
  private converter: Converter;
  private readonly setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  private setTableData: React.Dispatch<
    React.SetStateAction<Table | null>
  > | null;
  private readonly tableType: ViewSetting;
  private sqlCommandStack: any[];

  public constructor(
    converter: Converter,
    tableRef: React.Dispatch<React.SetStateAction<Table | null>> | null,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    tableType: ViewSetting,
    sqlCommandStack: any[]
  ) {
    this.converter = converter;
    this.setTableData = tableRef;
    this.setLoading = setLoading;
    this.tableType = tableType;
    this.sqlCommandStack = sqlCommandStack;
    window.electronAPI.subscribeToListener(
      async (tableData: TableData, fromDisk: boolean) => {
        if (this.setTableData) {
          sessionStorage.setItem("TableData", JSON.stringify(tableData));
          this.setTableData(await this.convert(this.tableType));
        }
      }
    );
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
        let reponse = await window.electronAPI.sendJsonFile(fileData);
        this.setLoading(false);
        if (reponse !== "ok") {
          alert(reponse);
        }
      };
      reader.readAsText(file);
    }
  }

  public async getTableData(from: From, tableName: string) {
    await window.electronAPI.getTableData(from, tableName);
  }

  public async getInitTableData() {
    const databaseExists = await window.electronAPI.databaseExists();
    if (databaseExists && this.setTableData) {
      const from: From = { startIndex: 0, endIndex: 100 };
      await window.electronAPI.getTableData(from, "main_table");
    }
  }

  public async clearOutDatabase(): Promise<void> {
    sessionStorage.clear();
    return await window.electronAPI.cleanDatabase();
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

  public async executeStack() {
    let reponse = await window.electronAPI.executeSqlCommandStack(
      createSqlQuery(this.sqlCommandStack),
      "main_table"
    );

    if (reponse !== "ok") {
      alert("Sql Error occured please press undo or reset");
    }
  }

  async restart() {
    throw new Error("Method not implemented.");
  }

  public async changingSchemaName(
    newColumnName: string,
    oldColumnName: string
  ) {
    await window.electronAPI.renameNamingColumn(
      createSqlQuery(this.sqlCommandStack),
      newColumnName,
      oldColumnName
    );
  }

  public async deleteColumn(columnName: string) {
    await window.electronAPI.deleteColumn(
      createSqlQuery(this.sqlCommandStack),
      columnName
    );
  }

  async getAllValue(columnName: string): Promise<string[]> {
    return await window.electronAPI.getAllColumnValues(columnName);
  }
}

export default UiManager;
