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
    const updatedTableData: TableData = {
      schema: tableData!.schema,
      table: newTableData,
    };
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
          <div>Loading...</div>
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
    </div>
  );
}

export default MainWindow;
