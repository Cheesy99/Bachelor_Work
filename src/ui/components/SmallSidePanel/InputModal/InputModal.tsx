import React, { useState } from "react";
import Modal from "react-modal";
import "./InputModal.css";
interface InputModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onSubmit: (inputValue: string) => void;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onRequestClose,
  onSubmit,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = () => {
    onSubmit(inputValue);
    onRequestClose();
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Input Modal" className="modal" overlayClassName="modal-overlay">
      <h2>Name your excel file:</h2>
      <div className="input-group">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
      <button className="submit-button" onClick={handleSubmit}>Submit</button>
      <button className="cancel-button" onClick={onRequestClose}>Cancel</button>
      <h3>File will be saved in download folder</h3>
    </Modal>
  );
};

export default InputModal;