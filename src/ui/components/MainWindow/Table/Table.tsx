import TableData from "../../../tableDataContext";
import "./Table.css";

function Table(tableData: TableData) {
  let data: TableData | undefined;

  if (tableData !== null) {
    data = tableData;
  } else {
    data = { schema: [], rows: [] };
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {data.schema === undefined ? (
              <th></th>
            ) : (
              data.schema.map((item, index) => <th key={index}>{item}</th>)
            )}
          </tr>
        </thead>
        <tbody>
          {data.rows === undefined ? (
            <td></td>
          ) : (
            data.rows.map((item) => (
              <tr key={item[0]}>
                {item.map((row) => (
                  <td>{row}</td>
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
