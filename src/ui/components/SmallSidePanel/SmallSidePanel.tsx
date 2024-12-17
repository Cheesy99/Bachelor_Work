import "@fortawesome/fontawesome-free/css/all.min.css";
import "./SmallSidePanel.css";
import { useContext, useState } from "react";
import { Context } from "../../App";
import Adapter from "../../Utils/Adapter";

function SmallSidePanel({ toggleSqlInput }: { toggleSqlInput: () => void }) {
  const context = useContext(Context);
  const adapter = Adapter.getInstance();
  if (!context) {
    throw new Error("SmallSidePanel must be used within a Context.Provider");
  }

  const exportToExcel = async () => {
    // await window.electronAPI.exportToExcel();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    adapter.insertJsonData(event);
  };

  const openSettings = () => {};

  return (
    <div className="small_panel">
      <label
        htmlFor="settings"
        className="settings-icon-label"
        onClick={openSettings}
        title="Settings"
      >
        <i className="fas fa-cog icon"></i> {/* Font Awesome settings icon */}
      </label>
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
