import "./assets/styles/App.css";
import BigSidePanel from "./components/BigSidePanel/BigSidePanel";
import MainWindow from "./components/MainWindow/MainWindow";
import SmallSidePanel from "./components/SmallSidePanel/SmallSidePanel";
import { TableData } from "./tableDataContext";
import React, { useState } from "react";

type ContextType = [
  TableData | null,
  React.Dispatch<React.SetStateAction<TableData | null>>
];

export const Context = React.createContext<ContextType | undefined>(undefined);

function App() {
  const [tableData, setTableData] = useState<TableData | null>(null);

  return (
    <Context.Provider value={[tableData, setTableData]}>
      <div className="app-container">
        <SmallSidePanel />
        <BigSidePanel />
        <MainWindow />
      </div>
    </Context.Provider>
  );
}

export default App;
