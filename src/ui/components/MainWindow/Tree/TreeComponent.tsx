import React from "react";
import Tree from "react-d3-tree";

type TreeProps = {
  data: NestedTable;
};

const convertToTree = (data: NestedTable, parentName: string = "root"): any => {
  const processTable = (table: NestedTable, parentName: string): any => {
    return {
      name: parentName,
      children: table.table.map((row) => {
        const nodeName = row[0].toString();
        const node: any = { name: nodeName, children: [] };

        row.forEach((cell, index) => {
          if (typeof cell === "object" && "schema" in cell && "table" in cell) {
            node.children.push(processTable(cell as NestedTable, nodeName));
          } else {
            node.children.push({
              name: `${table.schema[index]}: ${cell.toString()}`,
            });
          }
        });

        return node;
      }),
    };
  };

  return processTable(data, parentName);
};

const TreeComponent: React.FC<TreeProps> = ({ data }) => {
  const treeData = convertToTree(data);

  return (
    <div id="treeWrapper" style={{ width: "100%", height: "100vh" }}>
      <Tree
        data={treeData}
        orientation="horizontal" // Change to "horizontal" if you prefer
        translate={{ x: 200, y: 100 }} // Adjust the initial position
        pathFunc="diagonal" // Change to "diagonal" or "straight" if you prefer
        separation={{ siblings: 1, nonSiblings: 5 }} // Adjust separation
        nodeSize={{ x: 300, y: 50 }} // Adjust node size
      />
    </div>
  );
};

export default TreeComponent;
