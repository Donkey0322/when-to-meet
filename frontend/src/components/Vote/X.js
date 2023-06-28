import _ from "lodash";
import { useRef, useEffect, useState } from "react";
import { ScrollSyncPane } from "react-scroll-sync";
import styled from "styled-components";
import { RWD } from "../../constant";
import { useMeet } from "../../containers/hooks/useMeet";
import slotIDProcessing from "../../util/slotIDProcessing";
const { RWDFontSize, RWDHeight, RWDWidth, RWDVmin } = RWD;

const VotingContainer = Object.assign(
  styled.div`
    display: grid;
    grid-template-columns: min-content max-content;
    grid-column-gap: ${RWDWidth(6)};
    justify-content: center;
    /* max-width: ${RWDWidth(840)}; */
    /* border: 1px solid #000000; */
  `,
  {
    TimeContainer: styled.div`
      grid-column: 1/2;
      display: flex;
      flex-direction: column;
      font-size: ${RWDFontSize(12)};
      div {
        height: calc(${RWDHeight(5)} + ${RWDVmin(25)});
      }
    `,
    CellsContainer: Object.assign(
      styled.div`
        grid-column: 2/3;
        display: flex;
        column-gap: ${RWDWidth(5)};
        max-width: ${RWDWidth(760)};
        overflow-x: auto;
        &::-webkit-scrollbar {
          display: none;
        }
        -ms-overflow-style: none;
        scrollbar-width: none;
      `,
      {
        DayColumn: styled.div`
          display: flex;
          flex-shrink: 0;
          flex-direction: column;
          align-items: center;
          row-gap: ${RWDHeight(5)};
          div {
            font-size: ${RWDFontSize(14)};
            text-align: center;
          }
        `,
      }
    ),
  }
);

export default ({ DATERANGE, TIMESLOTIDS, Cells }) => {
  const {
    moment: { Moment },
  } = useMeet();
  /*調整 time gap 套組*/
  const WeekdayRef = useRef(null); //追蹤天數高度
  const [timeTop, setTimeTop] = useState(0);

  const throttledHandleResize = _.throttle(() => {
    if (WeekdayRef?.current) {
      setTimeTop(WeekdayRef.current.offsetHeight);
    }
  }, 100);

  useEffect(() => {
    if (WeekdayRef?.current) {
      setTimeTop(WeekdayRef.current.offsetHeight);
    } //load 時

    window.addEventListener("resize", throttledHandleResize);
    return () => {
      window.removeEventListener("resize", throttledHandleResize);
    };
  }, [DATERANGE]);
  /******************************************************/

  return (
    <VotingContainer>
      <VotingContainer.TimeContainer
        style={{
          marginTop: `${timeTop - 3}px`,
        }}
      >
        {TIMESLOTIDS.map((m, index) => (
          <div key={index}>{slotIDProcessing(m)}</div>
        ))}
      </VotingContainer.TimeContainer>
      <ScrollSyncPane>
        <VotingContainer.CellsContainer>
          {DATERANGE.map((m, d_index) => (
            <VotingContainer.CellsContainer.DayColumn key={d_index}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
                ref={WeekdayRef}
              >
                <div style={{ userSelect: "none" }}>
                  {Moment(m).format("MMM D")}
                </div>
                <div
                  style={{
                    userSelect: "none",
                    fontWeight: "700",
                  }}
                >
                  {Moment(m).format("ddd")}
                </div>
              </div>
              {TIMESLOTIDS.map((_, t_index) => {
                const Cell = Cells[d_index][t_index];
                return t_index !== TIMESLOTIDS.length - 1 && Cell;
              })}
            </VotingContainer.CellsContainer.DayColumn>
          ))}
        </VotingContainer.CellsContainer>
      </ScrollSyncPane>
    </VotingContainer>
  );
};
