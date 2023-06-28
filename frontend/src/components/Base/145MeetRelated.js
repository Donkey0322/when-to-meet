import React from "react";
import styled, { css } from "styled-components";
import Footer from "../Footer.js";
import Grid from "../Grid.js";
import Header from "../Header.js";
import { RWD } from "../../constant";
const { RWDFontSize, RWDHeight, RWDWidth, RWDVmin } = RWD;

const AvailabilityTitle = css`
  height: ${RWDHeight(65)};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${RWDFontSize(20)};
  font-weight: bold;
`;

const Base = (prop) => {
  const { children, login } = prop;
  if (login === undefined) {
    throw new Error(
      "Header 需包含「Login狀態」，prop 應如下輸入\nlogin:Boolean"
    );
  }

  return (
    <Grid
      {...prop}
      column={[10, 40, 50]}
      row={["7.5vh", "minmax(84vh, auto)", "8.5vh"]}
    >
      <Header
        style={{ gridRow: "1/2", gridColumn: "1/4" }}
        show={{ title: true, navbar: login, login }}
      />
      {children}
      <Footer style={{ gridColumn: "1/4", gridRow: "3/4" }} />
    </Grid>
  );
};

/**
 * @example
 * const LeftContainer = styled.div`
    grid-column: 2/3;
    grid-row: 2/4;
  `;
 */
Base.LeftContainer = styled.div`
  grid-column: 2/3;
  grid-row: 2/4;
`;
/**
 * @example
 * const LeftContainer = styled.div`
    grid-column: 3/4;
    grid-row: 2/3;
  `;
 */
Base.RightContainer = styled.div`
  grid-column: 3/4;
  grid-row: 2/3;
`;
/**
 * @example
 * const FullContainer = styled.div`
    grid-column: 2/4;
    grid-row: 2/3;
  `;
 */
Base.FullContainer = Object.assign(
  styled.div`
    grid-column: 2/4;
    grid-row: 2/3;
  `,
  {
    /**
     * @example
     * const ContentContainer = styled.div`
        display: grid;
        position: relative;
        top: ${RWDHeight(100)};
        grid-template-columns: 4fr 5fr;
        grid-template-rows: min-content min-content auto;
      `;
    */
    ContentContainer: Object.assign(
      styled.div`
        display: grid;
        /* position: relative; */
        margin-top: ${RWDHeight(100)};
        position: relative;
        grid-template-columns: 4fr 5fr;
        grid-template-rows: min-content min-content auto;
      `,
      {
        /**
         * @example
         * const Title = styled.div`
            display: flex;
            align-items: center;
            grid-column: 1/2;
            grid-row: 1/2;
            font-size: ${RWDFontSize(30)};
            font-weight: bold;
          `;
        */
        Title: styled.div`
          display: flex;
          align-items: center;
          grid-column: 1/2;
          grid-row: 1/2;
          font-size: ${RWDFontSize(30)};
          font-weight: bold;
        `,
        /**
         * @example
         * const InfoContainer = styled.div`
            display: flex;
            flex-direction: column;
            grid-column: 1/2;
            grid-row: 3/4;
            row-gap: ${RWDHeight(54)};
          `;
        */
        InfoContainer: Object.assign(
          styled.div`
            display: flex;
            flex-direction: column;
            grid-column: 1/2;
            grid-row: 3/4;
            row-gap: ${RWDHeight(54)};
          `,
          {
            /**
             * @example
             * const Info = styled.div`
                display: grid;
                grid-template-columns: repeat(2, max-content);
                grid-template-rows: repeat(8, max-content);
                grid-column-gap: ${RWDWidth(33)};
                grid-row-gap: ${RWDHeight(30)};
                font-size: ${RWDFontSize(20)};
                font-weight: 700;
              `;
            */
            Info: styled.div`
              display: grid;
              grid-template-columns: repeat(2, max-content);
              grid-template-rows: repeat(8, max-content);
              grid-column-gap: ${RWDWidth(33)};
              grid-row-gap: ${RWDHeight(30)};
              font-size: ${RWDFontSize(20)};
              font-weight: 700;
            `,
          }
        ),
        /**
         * @example
         * const GroupAvailability = styled.div`
            grid-column: 2/3;
            grid-row: 2/3;
            height: ${RWDHeight(65)};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${RWDFontSize(20)};
            font-weight: bold;
          `;
        */
        GroupAvailability: Object.assign(
          styled.div`
            grid-column: 2/3;
            grid-row: 2/3;
            ${AvailabilityTitle}
          `,
          {
            VotingArea: styled.div`
              grid-column: 2/3;
              grid-row: 3/4;
              width: 100%;
              display: flex;
              justify-content: center;
            `,
          }
        ),

        MyAvailability: Object.assign(
          styled.div`
            grid-column: 1/2;
            grid-row: 2/3;
            ${AvailabilityTitle}
          `,
          {
            VotingArea: styled.div`
              grid-column: 1/2;
              grid-row: 3/4;
              width: 100%;
              display: flex;
              justify-content: center;
              position: relative;
            `,
          }
        ),
      }
    ),
  }
);

export default Base;
