import { useContext, useState } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";
import { Context } from "../../App";
import { ViewSetting } from "../../connector/Enum/Setting";
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
}

type ContextType = [Table | null, ViewSetting, boolean, UiManager];

function MainWindow({
  showSqlInput,
  index,
  setSelectedColumnValues,
}: MainWindowProps) {
  const [viewType, setViewType] = useState("table");
  const context: ContextType | undefined = useContext(Context);
  const [sqlCommand, setSqlCommand] = useState("");
  const [currentRowIndex, setCurrentRowIndex] = useState<number>(0);
  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }
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

  const handleSqlSubmit = async () => {
    await window.electronAPI.sendSqlCommand(sqlCommand, "main_table");
  };

  const handleToggleChange = () => {
    setViewType(viewType === "table" ? "tree" : "table");
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
  return (
    <div className="main-window">
      <div className="header">
        <h4 className="table-name">main_table</h4>
        <div className="toggle-container">
          <span className="toggle-label">Table</span>
          <label className="switch">
            <input type="checkbox" onChange={handleToggleChange} />
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
        ) : (
          tableData && (
            <Table
              data={tableData}
              viewSetting={tableType}
              onHeaderClick={handleHeaderClick}
            />
          )
        )}
      </div>
      {showSqlInput && (
        <div className="sql-input">
          <input
            type="text"
            value={sqlCommand}
            onChange={(e) => setSqlCommand(e.target.value)}
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
