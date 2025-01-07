import { useContext, useState } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";
import { Context } from "../../App";
import { ViewSetting } from "../../Connector/Enum/Setting";

interface MainWindowProps {
  showSqlInput: boolean;
  setSelectedColumnValues: (values: (string | number)[]) => void;
}

type ContextType = [Table | null, ViewSetting, boolean];

function MainWindow({
  showSqlInput,
  setSelectedColumnValues,
}: MainWindowProps) {
  const context: ContextType | undefined = useContext(Context);
  const [sqlCommand, setSqlCommand] = useState("");
  const [currentRowIndex, setCurrentRowIndex] = useState<number>(0);
  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }
  const [tableData, tableType, loading] = context;

  const handleHeaderClick = (columnValues: (string | number)[]) => {
    setSelectedColumnValues(columnValues);
  };

  const handleSqlSubmit = async () => {
    console.log("arrived here");
    let newTableData: (string | number)[][] =
      await window.electronAPI.sendSqlCommand(sqlCommand, "main_table");
  };
  const handleNextRow = () => {
    if (tableData)
      if (currentRowIndex < tableData.table.length - 1) {
        setCurrentRowIndex(currentRowIndex + 1);
      }
  };

  const handlePreviousRow = () => {
    if (currentRowIndex > 0) {
      setCurrentRowIndex(currentRowIndex - 1);
    }
  };
  return (
    <div className="main-window">
      <div
        className={`stage ${
          tableType === ViewSetting.ONETABLE ? "one-table" : "nested-table"
        }`}
        style={{ marginTop: showSqlInput ? "20px" : "0" }}
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
          <button onClick={handlePreviousRow} disabled={currentRowIndex === 0}>
            Previous
          </button>
          <button
            onClick={handleNextRow}
            disabled={
              tableData ? currentRowIndex === tableData.table.length - 1 : false
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default MainWindow;
