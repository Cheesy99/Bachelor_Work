import Converter from "./Converter";
import NestedTableConverter from "./NestedTableConverter";
import OneTableConverter from "./OneTableConverter";
import { translateUmlauts, createSqlQuery, extractSchema } from "./Utils";
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
  private setSqlCommandStack: React.Dispatch<React.SetStateAction<string[]>>;

  public constructor(
    converter: Converter,
    setterTableRef: React.Dispatch<React.SetStateAction<Table | null>> | null,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    tableType: ViewSetting,
    sqlCommandStack: string[],
    setSqlCommandStack: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    this.setSqlCommandStack = setSqlCommandStack;
    this.converter = converter;
    this.setTableData = setterTableRef;
    this.setLoading = setLoading;
    this.tableType = tableType;
    this.sqlCommandStack = sqlCommandStack;

    window.electronAPI.subscribeToListener(
      async (tableObject: TableObject[]) => {
        if (this.setTableData) {
          sessionStorage.setItem("TableData", JSON.stringify(tableObject));
          this.setTableData(await this.convert(this.tableType));
        }
      }
    );
  }

  async getStack(): Promise<string[]> {
    return await window.electronAPI.getStack();
  }
  async popStack() {
    await window.electronAPI.popStack();
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

  public async getInitTableData() {
    const databaseExists = await window.electronAPI.databaseExists();
    if (databaseExists && this.setTableData) {
      await window.electronAPI.initTableData();
    }
    if (await window.electronAPI.hasStack()) {
      this.setSqlCommandStack(await window.electronAPI.getStack());
    } else {
      this.setSqlCommandStack([]);
    }
  }

  public async clearOutDatabase(): Promise<void> {
    sessionStorage.clear();
    return await window.electronAPI.cleanDatabase();
  }
  public convert(tableView: ViewSetting): Table {
    const table = sessionStorage.getItem("TableData");
    const result: TableObject[] = JSON.parse(table!);
    this.setStrategyByViewSetting(tableView);
    return this.converter.convertBackendData(result);
  }

  public async export(): Promise<void> {
    return await window.electronAPI.exportToExcel();
  }
  private setStrategyByViewSetting(viewSetting: ViewSetting) {
    if (viewSetting === ViewSetting.NESTEDTABLES) {
      this.converter.setStrategy(new NestedTableConverter());
    } else {
      this.converter.setStrategy(new OneTableConverter());
    }
  }

  public async executeStack(updatedSqlCommand?: string) {
    const commandToExecute =
      updatedSqlCommand ||
      this.sqlCommandStack[this.sqlCommandStack.length - 1];

    let reponse = await window.electronAPI.executeSqlCommand(commandToExecute);

    console.log("Man: ", reponse);
    const stack = [...this.sqlCommandStack, reponse];
    this.setSqlCommandStack(stack);
  }

  public async changingSchemaName(
    newColumnName: string,
    oldColumnName: string
  ) {
    await window.electronAPI.renameNamingColumn(newColumnName, oldColumnName);
  }

  async getMaxColumnValue(): Promise<number> {
    return await window.electronAPI.getMaxRowValue();
  }

  async getAllValue(columnName: string): Promise<string[]> {
    return await window.electronAPI.getAllColumnValues(columnName);
  }
}

export default UiManager;
