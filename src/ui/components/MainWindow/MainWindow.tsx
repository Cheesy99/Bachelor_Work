import { useContext, useState } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";
import { Context } from "../../App";
import { ViewSetting } from "../../Connector/Enum/Setting";
enum IndexDirection {
  RIGHT,
  LEFT,
}
interface MainWindowProps {
  showSqlInput: boolean;
  index: (direction: IndexDirection) => void;
  setSelectedColumnValues: (values: (string | number | TableData)[]) => void;
}

type ContextType = [Table | null, ViewSetting, boolean];

function MainWindow({
  showSqlInput,
  index,
  setSelectedColumnValues,
}: MainWindowProps) {
  const context: ContextType | undefined = useContext(Context);
  const [sqlCommand, setSqlCommand] = useState("");
  const [currentRowIndex, setCurrentRowIndex] = useState<number>(0);
  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }
  const [tableData, tableType, loading] = context;

  const handleHeaderClick = (columnIndex: number) => {
    if (tableData) {
      const columnValues = tableData.table.map((row) => row[columnIndex]);
      setSelectedColumnValues(columnValues);
    }
  };

  const handleSqlSubmit = async () => {
    let newTableData: (string | number)[][] =
      await window.electronAPI.sendSqlCommand(sqlCommand, "main_table");
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
      <h4 className="table-name">main_table</h4>
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
          <button onClick={handleLeft}>Previous</button>
          <button onClick={handleRight}>Next</button>
        </div>
      )}
    </div>
  );
}

export default MainWindow;
