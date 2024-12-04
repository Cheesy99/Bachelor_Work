import { useContext, useEffect, useState } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";
import { Context } from "../../App";

function MainWindow({ showSqlInput }: { showSqlInput: boolean }) {
  const context = useContext(Context);
  const [tableData, setTableData] = useState(context ? context[0] : null);
  const [sqlCommand, setSqlCommand] = useState("");

  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }

  useEffect(() => {
    window.electronAPI.onDatabaseChange((data: TableData) => {
      setTableData(data);
    });
  }, []);

  const handleHeaderClick = (column: (string | number)[]) => {};

  const handleSqlSubmit = async () => {
    window.electronAPI.sendSqlCommand(sqlCommand, "main_table");
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
