import React from "react";
import Modal from "react-modal";
import { ViewSetting } from "../../../connector/Enum/Setting";
import "./Settings.css";
import { useContext } from "react";
import { Context } from "../../../App";
interface SettingsModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  handleViewChange: (view: ViewSetting) => void;
  currentView: ViewSetting;
  deleteDatabase: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onRequestClose,
  handleViewChange,
  currentView,
  deleteDatabase,
}) => {
  useContext(Context);
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="modal"
      overlayClassName="modal-overlay"
    >
      <div className="radio-group">
        <label>
          <input
            type="radio"
            value="nested"
            checked={currentView === ViewSetting.NESTEDTABLES}
            onChange={() => handleViewChange(ViewSetting.NESTEDTABLES)}
          />
          Nested View
        </label>
        <label>
          <input
            type="radio"
            value="one"
            checked={currentView === ViewSetting.ONETABLE}
            onChange={() => handleViewChange(ViewSetting.ONETABLE)}
          />
          One View
        </label>
      </div>
      <button className="delete-DB" onClick={deleteDatabase}>
        Delete
      </button>
      <button className="close-button" onClick={onRequestClose}>
        Close
      </button>
    </Modal>
  );
};

export default SettingsModal;
