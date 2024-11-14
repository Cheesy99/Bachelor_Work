import "./assets/styles/App.css";
import BigSidePanel from "./components/BigSidePanel/BigSidePanel";
import MainWindow from "./components/MainWindow/MainWindow";
import SmallSidePanel from "./components/SmallSidePanel/SmallSidePanel";

function App() {
  return (
    <div className="app-container">
      <SmallSidePanel />
      <BigSidePanel />
      <MainWindow />
    </div>
  );
}

export default App;
