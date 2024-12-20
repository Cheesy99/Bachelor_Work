import { useContext, useState } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";
import { Context } from "../../App";
import Adapter from "../../Connector/UiManager";

interface MainWindowProps {
  showSqlInput: boolean;
  setSelectedColumnValues: (values: (string | number)[]) => void;
}

function MainWindow({
  showSqlInput,
  setSelectedColumnValues,
}: MainWindowProps) {
  const context = useContext(Context);
  const adapter = Adapter.getInstance();
  const [sqlCommand, setSqlCommand] = useState("");

  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }
  const [tableData, setTableData] = context;

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
      <div className="stage" style={{ marginTop: showSqlInput ? "20px" : "0" }}>
        <Table data={tableData!} onHeaderClick={handleHeaderClick} />
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
