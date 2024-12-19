import React from "react";
import Modal from "react-modal";
import { ViewSetting } from "../../../Connector/Enum/Setting";
import "./Settings.css";

interface SettingsModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onViewChange: (view: ViewSetting) => void;
  currentView: ViewSetting;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onRequestClose,
  onViewChange,
  currentView,
}) => {
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
            onChange={() => onViewChange(ViewSetting.NESTEDTABLES)}
          />
          Nested View
        </label>
        <label>
          <input
            type="radio"
            value="one"
            checked={currentView === ViewSetting.ONETABLE}
            onChange={() => onViewChange(ViewSetting.ONETABLE)}
          />
          One View
        </label>
      </div>
      <button className="close-button" onClick={onRequestClose}>
        Close
      </button>
    </Modal>
  );
};

export default SettingsModal;
