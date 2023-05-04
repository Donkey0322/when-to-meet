/*TODO:********************************************************************************************
  1.Grid, line-name 可以設定成 header start /end 和 footer start / end。
**************************************************************************************************/
import Backdrop from "@mui/material/Backdrop";
import _ from "lodash";
import React from "react";
import styled from "styled-components";
import { useMeet } from "../containers/hooks/useMeet";
import { ANIME, RWD } from "../constant";
import Title from "./Title";
const { RWDVmin } = RWD;

const GridContainer = styled.div`
  display: grid;
  position: relative;
  grid-template-columns: ${({ gridColumn }) => gridColumn};
  grid-template-rows: ${({ gridRow }) => gridRow};
`;

const Loading = styled.div`
  ${ANIME.Rotate}
  width: ${RWDVmin(300)};
  height: ${RWDVmin(300)};
  background-color: #fdf3d1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
`;

const Grid = (prop) => {
  const { column, row, children } = prop;
  const { loading } = useMeet();

  if (
    !column ||
    !row ||
    (!column.find((e) => typeof e === "string") && _.sum(column) !== 100) ||
    (!row.find((e) => typeof e === "string") && _.sum(row) !== 100)
  ) {
    throw new Error("請填入正確數字，加起來要100");
  }
  const gridColumn =
    column.reduce((acc, curr, index) => {
      acc += `[line${index + 1}] ${
        typeof curr === "number" ? `${curr}%` : curr
      } `;
      return acc;
    }, "") + `[line${column.length + 1}]`;

  const gridRow =
    row.reduce((acc, curr, index) => {
      acc += `[line${index + 1}] ${
        typeof curr === "number" ? `${curr}%` : curr
      } `;
      return acc;
    }, "") + `[line${row.length + 1}]`;

  return (
    <GridContainer {...prop} gridColumn={gridColumn} gridRow={gridRow}>
      <Backdrop
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <Loading>
          <Title style>Let's Meet</Title>
        </Loading>
      </Backdrop>
      {children}
    </GridContainer>
  );
};

export default Grid;
