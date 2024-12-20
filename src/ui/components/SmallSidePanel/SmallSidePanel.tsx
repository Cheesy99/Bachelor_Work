import "@fortawesome/fontawesome-free/css/all.min.css";
import "./SmallSidePanel.css";
import { useContext, useState } from "react";
import { Context } from "../../App";
import Adapter from "../../Connector/UiManager";
import SettingsModal from "./Settings/Settings";
import React from "react";
import { ViewSetting } from "../../Connector/Enum/Setting";
import Modal from "react-modal";

Modal.setAppElement("#root");
interface SmallSidePanelProps {
  toggleSqlInput: () => void;
  onViewChange: (view: ViewSetting) => void;
}
function SmallSidePanel({ toggleSqlInput, onViewChange }: SmallSidePanelProps) {
  const context = useContext(Context);
  const adapter = Adapter.getInstance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewType, setViewType] = useState<ViewSetting>(
    ViewSetting.NESTEDTABLES
  );
  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }

  const exportToExcel = async () => {
    // await window.electronAPI.exportToExcel();
  };

  const openSettings = () => {
    setIsModalOpen(true);
  };

  const handleViewChange = (view: ViewSetting) => {
    setViewType(view);
    onViewChange(view);
  };

  const closeSettings = () => {
    console.log("closeSettings called");
    setIsModalOpen(false);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    adapter.insertJsonData(event);
  };

  return (
    <div className="small_panel">
      <label
        htmlFor="settings"
        className="settings-icon-label"
        onClick={openSettings}
        title="Settings"
      >
        <i className="fas fa-cog icon"></i>
      </label>
      <SettingsModal
        isOpen={isModalOpen}
        onRequestClose={closeSettings}
        onViewChange={handleViewChange}
        currentView={viewType}
      />

      <label
        htmlFor="excelUpload"
        className="excel-icon-label"
        onClick={exportToExcel}
        title="Export to Excel"
      >
        <i className="fas fa-file-excel icon"></i>
      </label>
      <label
        htmlFor="sqlUpload"
        className="sql-icon-label"
        onClick={toggleSqlInput}
        title="SQL Command"
      >
        <i className="fas fa-database icon"></i>
      </label>
      <label
        htmlFor="fileUpload"
        className="upload-icon-label"
        title="Upload JSON"
      >
        <i className="fas fa-upload icon"></i>
      </label>
      <input
        type="file"
        id="fileUpload"
        className="file-upload"
        accept=".json"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default SmallSidePanel;
