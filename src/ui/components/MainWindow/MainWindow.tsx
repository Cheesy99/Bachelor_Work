import { useContext, useState, useEffect } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";
import { createSqlQuery, createSqlQueryForView } from "../../connector/Utils";
import { Context, ContextCommandStack } from "../../App";
import { ViewSetting, Display } from "../../connector/Enum/Setting";
import UiManager from "../../connector/UiManager";
enum IndexDirection {
  RIGHT,
  LEFT,
}
interface MainWindowProps {
  showSqlInput: boolean;
  index: (direction: IndexDirection) => void;
  setSelectedColumnValues: (values: {
    values: (string | number | TableData)[];
    columnName: string;
  }) => void;
  handleUndo: () => Promise<void>;
  onIdClick: (values: (string | number)[]) => void;
  setTable: React.Dispatch<React.SetStateAction<Table | null>>;
}
type ContextStack = [
  string[],
  React.Dispatch<React.SetStateAction<string[]>>,
  number,
  React.Dispatch<React.SetStateAction<number>>,
  number
];
type ContextType = [
  Table | null,
  ViewSetting,
  boolean,
  UiManager,
  React.Dispatch<React.SetStateAction<Table | null>>
];

function MainWindow({
  showSqlInput,
  index,
  setSelectedColumnValues,
  handleUndo,
  onIdClick,
  setTable,
}: MainWindowProps) {
  const context: ContextType | undefined = useContext(Context);
  const contextCommandStack: ContextStack | undefined =
    useContext(ContextCommandStack);
  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }
  if (!contextCommandStack) {
    throw new Error("contextCommandStack is not defined");
  }
  const [
    sqlCommandStack,
    setSqlCommandStack,
    amountOfShownRows,
    setIndexStart,
    indexStart,
  ] = contextCommandStack;
  const [tableData, tableType, loading, uiManager] = context;

  const handleOneHeaderClick = async (columnIndex: number) => {
    if (tableData) {
      const tableName = tableData.schema[columnIndex];
      setSelectedColumnValues({
        values: await uiManager.getAllValue(tableName),
        columnName: tableName,
      });
    }
  };

  const onDoubleClick = async (
    newColumnName: string,
    oldColumnName: string
  ) => {
    if (oldColumnName !== newColumnName) {
      await uiManager.changingSchemaName(newColumnName, oldColumnName);
    }
  };

  const handleSqlSubmit = async () => {
    if (tableData) {
      await uiManager.executeStack();
    } else alert("Table Data is not been uploaded");
  };

  const handleRight = () => {
    if (tableData) {
      index(IndexDirection.RIGHT);
    }
  };

  const handleLeft = () => {
    if (tableData) {
      index(IndexDirection.LEFT);
    }
  };

  const handleSqlInputField = (value: string) => {
    const newSqlCommandStack = [...sqlCommandStack, value];
    setSqlCommandStack(newSqlCommandStack);
  };

  async function handleReset(): Promise<void> {
    const confirmed = window.confirm(
      "Are you sure you want to reset all changes will be removed"
    );
    if (confirmed) {
      setSqlCommandStack([
        tableData
          ? `SELECT ${tableData?.schema!} FROM main_table LIMIT ${amountOfShownRows} OFFSET ${indexStart} ;`
          : "",
      ]);
      setIndexStart(0);

      await uiManager.executeStack();
    }
  }

  return (
    <div className="main-window">
      <div className="header">
        <div className="header-button">
          <button onClick={handleUndo}>Undo</button>
          <button onClick={handleReset}>Reset</button>
        </div>
      </div>
      <div
        className={`stage ${
          tableType === ViewSetting.ONETABLE ? "one-table" : "nested-table"
        }`}
      >
        {loading ? (
          <div className="loading-bar">Loading...</div>
        ) : tableData ? (
          <Table
            data={tableData}
            onDoubleClick={onDoubleClick}
            viewSetting={tableType}
            onHeaderClick={handleOneHeaderClick}
            onIdClick={onIdClick}
          />
        ) : (
          <div className="default-stage">
            <p>No data available. Please select a table or load data.</p>
          </div>
        )}
      </div>

      {showSqlInput && (
        <div className="sql-input">
          <textarea
            value={sqlCommandStack[sqlCommandStack.length - 1]}
            onChange={(e) => handleSqlInputField(e.target.value)}
            placeholder="Enter SQL command"
            spellCheck={false}
          />
          <button onClick={handleSqlSubmit}>Execute</button>
        </div>
      )}
      {!showSqlInput && (
        <div className="bottom-row">
          <button onClick={handleLeft}>Previous</button>
          <button onClick={handleRight}>Next</button>
        </div>
      )}
    </div>
  );
}

export default MainWindow;
