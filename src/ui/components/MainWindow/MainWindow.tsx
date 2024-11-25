import { useEffect, useState } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";

function MainWindow() {
  const [tableData, setTableData] = useState<TableData | null>(null);

  const fetchTableData = async () => {
    const data = await window.electronAPI.getTableData([1, 20], "main_table");
    setTableData(data);
    console.log(data);
  };

  return (
    <div className="main-window">
      <div className="stage">
        <button onClick={fetchTableData}>Fetch Table Data</button>
        {tableData && (
          <div>
            <h3>Table Data:</h3>
            <pre>{JSON.stringify(tableData, null, 2)}</pre>
          </div>
        )}
        <Table />
      </div>
    </div>
  );
}

export default MainWindow;
