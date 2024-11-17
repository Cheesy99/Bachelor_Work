import { useEffect } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";

function MainWindow() {
  const handleChange = useEffect(() => {
    //@ts-ignore
    window.electronAPI.onDatabaseChange(
      async (amountOfRowsFromMainTable: number) => {
        console.log(
          `Database updated, refreshing table view... ${amountOfRowsFromMainTable} `
        );
        let tableData;
        if (amountOfRowsFromMainTable < 20) {
          //@ts-ignore
          tableData = await window.electronAPI.getTableData(
            [1, amountOfRowsFromMainTable],
            "main_table"
          );
        } else {
          //@ts-ignore
          tableData = await window.electronAPI.getTableData(
            [1, 20],
            "main_table"
          );
        }
        console.log(tableData);

        // Add your logic to refresh the table view here
      }
    );
  }, []);

  return (
    <div className="main-window">
      <div className="stage">
        <Table />
      </div>
    </div>
  );
}

export default MainWindow;
