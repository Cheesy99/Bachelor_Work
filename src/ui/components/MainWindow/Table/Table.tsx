import TableData from "../../../tableDataContext";
import "./Table.css";

interface TableProps {
  data: {
    schema: string[];
    table: (string | number)[][];
  } | null;
  onHeaderClick: (column: (string | number)[]) => void;
}

function Table({ data, onHeaderClick }: TableProps) {
  if (!data) {
    return <div>No data available</div>; // Handle the case where data is null
  }

  const handleHeaderClick = (columnIndex: number) => {
    const columnValues = data!.table.map((row) => row[columnIndex]);
    const uniqueColumnValues = Array.from(new Set(columnValues));
    onHeaderClick(uniqueColumnValues);
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {data.schema === undefined ? (
              <th></th>
            ) : (
              data.schema.map((item, index) => (
                <th key={index} onClick={() => handleHeaderClick(index)}>
                  {item}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {data.table === undefined ? (
            <tr>
              <td></td>
            </tr>
          ) : (
            data.table.map((item, rowIndex) => (
              <tr key={rowIndex} onClick={() => onHeaderClick(item)}>
                {item.map((row, cellIndex) => (
                  <td key={cellIndex}>{row}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
