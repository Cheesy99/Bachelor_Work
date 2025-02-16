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
  private sqlCommand: string;
  private setSqlCommand: React.Dispatch<React.SetStateAction<string>>;

  public constructor(
    converter: Converter,
    setterTableRef: React.Dispatch<React.SetStateAction<Table | null>> | null,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    tableType: ViewSetting,
    sqlCommand: string,
    setSqlCommand: React.Dispatch<React.SetStateAction<string>>
  ) {
    this.setSqlCommand = setSqlCommand;
    this.converter = converter;
    this.setTableData = setterTableRef;
    this.setLoading = setLoading;
    this.tableType = tableType;
    this.sqlCommand = sqlCommand;

    window.electronAPI.subscribeToListener(
      async (tableObject: TableObject[]) => {
        if (this.setTableData) {
          sessionStorage.setItem("TableData", JSON.stringify(tableObject));
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
        let reponse: string = await window.electronAPI.sendJsonFile(fileData);
        this.setSqlCommand(reponse);
        this.setLoading(false);
      };
      reader.readAsText(file);
    }
  }

  public async getInitTableData() {
    const databaseExists = await window.electronAPI.databaseExists();
    if (databaseExists) {
      await window.electronAPI.initTableData();
    } else {
      this.setSqlCommand("Insert Json data");
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

  public async executeSqlCommand(updatedSqlCommand: string) {
    const commandToExecute = updatedSqlCommand;
    console.log("command: ", updatedSqlCommand);

    let reponse: string = await window.electronAPI.executeSqlCommand(
      commandToExecute
    );
    if (reponse === "error") {
      alert("The sql command is invalid please try again");
      const getLastCommand = await window.electronAPI.getLastCommand();
      this.setSqlCommand(getLastCommand);
    } else {
      this.setSqlCommand(reponse);
    }
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

  public async undo() {
    const reponse = await window.electronAPI.undo();
    this.setSqlCommand(reponse);
  }

  public async reset() {
    const reponse = await window.electronAPI.reset();
    this.setSqlCommand(reponse);
  }
}

export default UiManager;
