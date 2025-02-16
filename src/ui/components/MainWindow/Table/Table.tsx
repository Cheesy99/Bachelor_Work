import "./Table.css";
import { ViewSetting } from "../../../connector/Enum/Setting";
import React, { useState } from "react";
interface TableProps {
  data: Table;
  viewSetting: ViewSetting;
  onHeaderClick: (column: number) => void;
  onIdClick: (rowData: (string | number)[]) => void;
  onDoubleClick: (newName: string, oldName: string) => void;
}

function Table({
  data,
  viewSetting,
  onHeaderClick,
  onIdClick,
  onDoubleClick,
}: TableProps) {
  const isOneTable = (viewSetting: ViewSetting): boolean => {
    return viewSetting === ViewSetting.ONETABLE ? true : false;
  };
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newColumnName, setNewColumnName] = useState<string>("");
  const [oldColumnName, setOldColumnName] = useState<string>("");

  if (!data) {
    return <div>No data available</div>;
  }

  const handleHeaderDoubleClick = (index: number) => {
    setEditingIndex(index);
    setOldColumnName(data.schema[index]);
    setNewColumnName(data.schema[index]);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewColumnName(e.target.value);
  };

  const handleHeaderBlur = () => {
    onDoubleClick(newColumnName, oldColumnName);
    setEditingIndex(null);
  };

  const renderTableData = (data: TableData) => {
    return (
      <>
        <table>
          <thead>
            <tr>
              {data.schema.map((columnName, index) => (
                <th
                  key={index}
                  onClick={() => onHeaderClick(index)}
                  onDoubleClick={() => handleHeaderDoubleClick(index)}
                >
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={handleHeaderChange}
                      onBlur={() => handleHeaderBlur()}
                      autoFocus
                    />
                  ) : (
                    columnName
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.table.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cellIndex === 0 ? "id-column" : ""}
                    onClick={() => cellIndex === 0 && onIdClick(row)}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  const renderNestedTable = (data: NestedTable) => {
    return (
      <>
        <table>
          <thead>
            <tr>
              {data.schema.map((column, index) => (
                <th key={index}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.table.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Array.isArray(row) ? (
                  row.map((cell, cellIndex) => (
                    <td key={cellIndex}>
                      {typeof cell === "object" &&
                      cell !== null &&
                      "schema" in cell &&
                      "table" in cell
                        ? renderNestedTable(cell)
                        : cell}
                    </td>
                  ))
                ) : (
                  <td colSpan={data.schema.length}>{row}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  return (
    <div className="stage-container">
      {isOneTable(viewSetting)
        ? renderTableData(data as TableData)
        : renderNestedTable(data as NestedTable)}
    </div>
  );
}

export default Table;
