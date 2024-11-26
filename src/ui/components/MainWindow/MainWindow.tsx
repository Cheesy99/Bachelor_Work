import { useContext } from "react";
import "./MainWindow.css";
import Table from "./Table/Table";
import { Context } from "../../App";
import TableData from "../../tableDataContext";

function MainWindow() {
  const context = useContext(Context);

  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }

  const [tableData] = context;

  return (
    <div className="main-window">
      <div className="stage">
        <Table {...tableData!} />
      </div>
    </div>
  );
}

export default MainWindow;
