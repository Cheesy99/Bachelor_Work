import { useContext, useState, useEffect } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";
import { createSqlQuery, createSqlQueryForView } from "../../connector/Utils";
import { Context, ContextCommandStack } from "../../App";
import { ViewSetting, Display } from "../../connector/Enum/Setting";
import UiManager from "../../connector/UiManager";
import TreeComponent from "./Tree/TreeComponent";
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
  onIdClick: (values: (string | number)[]) => void;
  setTable: React.Dispatch<React.SetStateAction<Table | null>>;
  setTableType: React.Dispatch<React.SetStateAction<ViewSetting>>;
}
type ContextStack = [any[], React.Dispatch<React.SetStateAction<any[]>>];
type ContextType = [Table | null, ViewSetting, boolean, UiManager];

function MainWindow({
  showSqlInput,
  index,
  setSelectedColumnValues,
  onIdClick,
  setTable,
  setTableType,
}: MainWindowProps) {
  const [viewType, setViewType] = useState<Display>(Display.TABLE);
  const context: ContextType | undefined = useContext(Context);
  const [sqlCommand, setSqlCommand] = useState("");
  const [currentRowIndex, setCurrentRowIndex] = useState<number>(0);
  const contextCommandStack: ContextStack | undefined =
    useContext(ContextCommandStack);
  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }
  if (!contextCommandStack) {
    throw new Error("contextCommandStack is not defined");
  }
  const [sqlCommandStack, setSqlCommandStack] = contextCommandStack;
  const [tableData, tableType, loading, uiManager] = context;

  const handleHeaderClick = (columnIndex: number) => {
    if (tableData) {
      const columnValues = tableData.table.map((row) => row[columnIndex]);
      setSelectedColumnValues({
        values: columnValues,
        columnName: tableData.schema[columnIndex],
      });
    }
  };
  //BUGG WHEN CHANGING NAME WITH INVALID STACK
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
      const selectColumnsMatch = sqlCommand.match(/SELECT\s+(.*?)\s+FROM/i);
      let selectColumns: string[] = [];
      if (selectColumnsMatch && selectColumnsMatch[1]) {
        selectColumns = selectColumnsMatch[1]
          .split(",")
          .map((col) => col.trim());
      }

      await uiManager.executeStack(selectColumns);
    } else alert("Table Data is not been uploaded");
  };

  const handleToggleChange = () => {
    setViewType(viewType === Display.TABLE ? Display.TREE : Display.TABLE);
  };

  const handleRight = () => {
    if (tableData)
      if (currentRowIndex < tableData.table.length - 1) {
        setCurrentRowIndex(currentRowIndex + 1);
        index(IndexDirection.RIGHT);
      }
  };

  const handleLeft = () => {
    if (currentRowIndex > 0) {
      setCurrentRowIndex(currentRowIndex - 1);
      index(IndexDirection.LEFT);
    }
  };
  async function handleUndo(): Promise<void> {
    let history: any[] = sqlCommandStack;
    if (history.length !== 0) {
      history.pop();
      await uiManager.executeStack(tableData?.schema!);
    }
  }

  const handleSqlInputField = (value: string) => {
    setSqlCommand(value);
    console.log(value);
  };

  useEffect(() => {
    if (showSqlInput) {
      if (tableData)
        setSqlCommand(createSqlQueryForView(sqlCommandStack, tableData.schema));
      else setSqlCommand("");
    }
  }, [showSqlInput, sqlCommandStack]);

  async function handleReset(): Promise<void> {
    //HERE BUG IN THAT NOW WHOLE TABLE SAVED ON DISK
    const confirmed = window.confirm(
      "Are you sure you want to reset all changes will be removed"
    );
    if (confirmed) {
      setSqlCommandStack([]);
      await uiManager.restart();
    }
  }

  return (
    <div className="main-window">
      <div className="header">
        <div className="header-button">
          <button onClick={handleUndo}>Undo</button>
          <button onClick={handleReset}>Reset</button>
        </div>
        <div className="toggle-container">
          <span className="toggle-label">Table</span>
          <label className="switch">
            <input
              type="checkbox"
              onChange={handleToggleChange}
              disabled={!tableData}
            />
            <span className="slider round"></span>
          </label>
          <span className="toggle-label">Tree</span>
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
          viewType === Display.TABLE ? (
            <Table
              data={tableData}
              onDoubleClick={onDoubleClick}
              viewSetting={tableType}
              onHeaderClick={handleHeaderClick}
              onIdClick={onIdClick}
            />
          ) : (
            <TreeComponent
              tableSetter={setTable}
              data={tableData}
              viewSetting={tableType}
              uiManager={uiManager}
              setTableType={setTableType}
            />
          )
        ) : (
          <div className="default-stage">
            <p>No data available. Please select a table or load data.</p>
          </div>
        )}
      </div>

      {showSqlInput && (
        <div className="sql-input">
          <textarea
            value={sqlCommand}
            onChange={(e) => handleSqlInputField(e.target.value)}
            placeholder="Enter SQL command"
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
