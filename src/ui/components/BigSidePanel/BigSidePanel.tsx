import "./BigSidePanel.css";

interface BigSidePanelProps {
  columnValues: (string | number)[];
}

function BigSidePanel({ columnValues }: BigSidePanelProps) {
  return (
    <div className="big-side-panel">
      <h2>Column Values</h2>
      <ul>
        {columnValues.map((value, index) => (
          <li key={index}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

export default BigSidePanel;
