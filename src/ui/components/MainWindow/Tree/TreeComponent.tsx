import React from "react";
import Tree from "react-d3-tree";

type TreeProps = {
  data: NestedTable;
};

function TreeComponent({ data }: TreeProps) {
  const convertToTree = (
    data: NestedTable,
    parentName: string = "root"
  ): any => {
    const processTable = (table: NestedTable, parentName: string): any => {
      return {
        name: parentName,
        children: table.table.map((row) => {
          const nodeName = row[0].toString();
          const node: any = { name: nodeName, children: [] };

          row.forEach((cell, index) => {
            if (
              typeof cell === "object" &&
              "schema" in cell &&
              "table" in cell
            ) {
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

  const treeData = convertToTree(data);

  return (
    <div id="treeWrapper" style={{ width: "100%", height: "100vh" }}>
      <Tree
        data={treeData}
        orientation="horizontal"
        translate={{ x: 200, y: 100 }}
        pathFunc="diagonal"
        separation={{ siblings: 1, nonSiblings: 5 }}
        nodeSize={{ x: 300, y: 50 }}
      />
    </div>
  );
}

export default TreeComponent;
