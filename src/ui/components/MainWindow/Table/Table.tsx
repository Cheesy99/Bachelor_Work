import { useEffect, useState } from "react";
import "./Table.css";
import UiManager from "../../../Connector/UiManager";
import { ViewSetting } from "../../../Connector/Enum/Setting";

interface TableProps {
  data: Table;
  viewSetting: ViewSetting;
  onHeaderClick: (column: (string | number)[]) => void;
}

function Table({ data, viewSetting, onHeaderClick }: TableProps) {
  const isOneTable = (viewSetting: ViewSetting): boolean => {
    return viewSetting === ViewSetting.ONETABLE ? true : false;
  };

  if (!data) {
    return <div>No data available</div>;
  }

  const renderTableData = (data: TableData) => {
    return (
      <>
        <table>
          <thead>
            <tr>
              {data.schema.map((item, index) => (
                <th key={index}>{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.table.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  const renderNestedTable = (data: NestedTable) => {
    console.log("I was called");
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
    <div>
      {isOneTable(viewSetting)
        ? renderTableData(data as TableData)
        : renderNestedTable(data as NestedTable)}
    </div>
  );
}

export default Table;
