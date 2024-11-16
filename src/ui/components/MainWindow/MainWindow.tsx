import { useEffect } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";

function MainWindow() {
  const handleChange = useEffect(() => {
    //@ts-ignore
    window.electronAPI.onDatabaseChange((amountOfRows: number) => {
      console.log(
        `Database updated, refreshing table view... ${amountOfRows} `
      );
      // Add your logic to refresh the table view here
    });
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
