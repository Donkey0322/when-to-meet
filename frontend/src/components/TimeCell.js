import { Tooltip } from "antd";
import _ from "lodash";
import React, { forwardRef, useState } from "react";
import styled from "styled-components";
import { RWD } from "../constant";
const { RWDRadius, RWDVmin } = RWD;

const CELLTYPE = ["draggable", "info", "confirm"];

const Cell = styled.div`
  width: ${RWDVmin(50)};
  height: ${RWDVmin(25)};
  cursor: pointer;
  border-radius: ${RWDRadius(10)};
`;

const TimeCell = (type) =>
  forwardRef(({ info, drag, ...prop }, ref) => {
    if (!CELLTYPE.includes(type)) {
      throw new Error(
        `請定義 Tag 種類，有以下可以選擇：\n${CELLTYPE.join(", ")}`
      );
    }
    const [hover, setHover] = useState(false);

    switch (type) {
      case "confirm":
      case "draggable":
        const {
          cell,
          setCell,
          startDrag,
          setStartDrag,
          startIndex,
          block,
          setBlock,
          setStartIndex,
          mode,
          setMode,
          oriCell,
          setUpdatedCell,
        } = drag;

        const handleCellMouseDown = (index) => (e) => {
          if (setBlock) {
            setBlock(false);
          }
          setMode(!cell[index[0]][index[1]]);
          if (cell[index[0]][index[1]] === null) {
            setMode(true);
            setBlock(true);
          }
          e.preventDefault();
          setStartDrag(true);
          setStartIndex(index);
          setCell((prev) => {
            let result = JSON.parse(JSON.stringify(prev));
            result[index[0]][index[1]] = !result[index[0]][index[1]];
            return result;
          });
          setUpdatedCell([index]);
        };

        const handleCellMouseEnter = (index) => (e) => {
          e.preventDefault();
          if (startDrag) {
            const xRange = [
              startIndex[0],
              type === "confirm" ? startIndex[0] : index[0],
            ].sort((a, b) => a - b);
            const yRange = [startIndex[1], index[1]].sort((a, b) => a - b);
            let updatedCell = [[startIndex[0], startIndex[1]]];
            let allNewCells = JSON.parse(JSON.stringify(oriCell));
            for (const d_index of _.range(xRange[0], xRange[1] + 1)) {
              for (const t_index of _.range(yRange[0], yRange[1] + 1)) {
                if (!block && oriCell[d_index][t_index] === null) {
                  continue;
                }
                if (oriCell[d_index][t_index] !== mode) {
                  updatedCell.push([d_index, t_index]);
                }
                allNewCells[d_index][t_index] = mode;
              }
            }
            setUpdatedCell(
              updatedCell.sort((a, b) => a[0] - b[0] || a[1] - b[1])
            );
            setCell(allNewCells);
          } else {
            setHover(true);
          }
        };
        prop.onMouseDown = handleCellMouseDown(prop.index);
        prop.onMouseEnter = handleCellMouseEnter(prop.index);
        prop.onMouseLeave = () => {
          setHover(false);
        };
        break;
      case "info":
        prop.onMouseEnter = () => {
          setHover(true);
        };
        prop.onMouseLeave = () => {
          setHover(false);
        };
        break;
      default:
        break;
    }
    return (
      <Tooltip
        title={info}
        color="#FFFFFF"
        open={hover && type !== "draggable"}
      >
        <Cell {...prop} ref={ref} />
      </Tooltip>
    );
  });

export default TimeCell;

export { default as slotIDProcessing } from "../util/slotIDProcessing";
