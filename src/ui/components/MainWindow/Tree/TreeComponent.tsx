import React, { useContext, useState, useEffect } from "react";
import Tree from "react-d3-tree";
import { ViewSetting } from "../../../connector/Enum/Setting";
import UiManager from "../../../connector/UiManager";
import { Context } from "../../../App";
type TreeComponentProps = {
  data: Table;
  viewSetting: ViewSetting;
  uiManager: UiManager;
  tableSetter: React.Dispatch<React.SetStateAction<Table | null>>;
  setTableType: React.Dispatch<React.SetStateAction<ViewSetting>>;
};

type RawNodeDatum = {
  name: string;
  children?: RawNodeDatum[];
};

const TreeComponent: React.FC<TreeComponentProps> = ({
  data,
  viewSetting,
  uiManager,
  tableSetter,
  setTableType,
}) => {
  const [treeData, setTreeData] = useState<RawNodeDatum | undefined>(undefined);

  useEffect(() => {
    const convertToTree = (table: Table): RawNodeDatum => {
      const processTable = (
        table: NestedTable,
        parentName: string
      ): RawNodeDatum => {
        return {
          name: parentName,
          children: table.table.map((row) => {
            const nodeName = row[0].toString();
            const node: RawNodeDatum = { name: nodeName, children: [] };

            row.forEach((cell, index) => {
              if (
                typeof cell === "object" &&
                "schema" in cell &&
                "table" in cell
              ) {
                node.children!.push(
                  processTable(cell as NestedTable, nodeName)
                );
              } else {
                node.children!.push({
                  name: `${table.schema[index]}: ${cell.toString()}`,
                });
              }
            });

            return node;
          }),
        };
      };

      return processTable(data, "root");
    };
    //This doesn't work it doesn't change the table
    const fetchData = async () => {
      if (viewSetting === ViewSetting.ONETABLE) {
        setTableType(ViewSetting.NESTEDTABLES);
        tableSetter(await uiManager.convert(ViewSetting.NESTEDTABLES));
      }
      setTreeData(convertToTree(data));
    };

    fetchData();
  }, [data, viewSetting, uiManager]);

  const renderCustomNodeElement = ({
    nodeDatum,
  }: {
    nodeDatum: RawNodeDatum;
  }) => {
    if (nodeDatum.children && nodeDatum.children.length > 0) {
      return (
        <g>
          <circle r={15}></circle>
          <text fill="black" strokeWidth="1" x="20">
            {nodeDatum.name}
          </text>
        </g>
      );
    } else {
      return (
        <foreignObject width={200} height={100} x={0} y={-10}>
          <table
            border={1}
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <tbody>
              {nodeDatum.name.split(", ").map((cell, index) => (
                <tr key={index}>
                  <td>{cell}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </foreignObject>
      );
    }
  };

  if (!treeData) {
    return <div>Loading tree data...</div>;
  }

  return (
    <div id="treeWrapper" style={{ width: "100%", height: "100vh" }}>
      <Tree
        data={treeData}
        orientation="horizontal"
        translate={{ x: 200, y: 100 }}
        // prettier-ignore
        pathFunc="elbow"
        separation={{ siblings: 1, nonSiblings: 5 }}
        nodeSize={{ x: 600, y: 50 }}
        renderCustomNodeElement={renderCustomNodeElement}
      />
    </div>
  );
};
export default TreeComponent;
