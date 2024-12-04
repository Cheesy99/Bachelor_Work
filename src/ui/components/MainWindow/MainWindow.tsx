import { useContext, useEffect, useState } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";
import { Context } from "../../App";
import TableData from "../../tableDataContext";

function MainWindow() {
  const context = useContext(Context);
  const [tableData, setTableData] = useState(context ? context[0] : null);

  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }

  useEffect(() => {
    window.electronAPI.onDatabaseChange((data: TableData) => {
      setTableData(data);
    });
  }, []);

  return (
    <div className="main-window">
      <div className="stage">
        <Table {...tableData!} />
      </div>
    </div>
  );
}

export default MainWindow;
