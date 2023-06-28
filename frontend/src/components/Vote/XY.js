import _ from "lodash";
import { useRef, useEffect, useState } from "react";
import { ScrollSyncPane } from "react-scroll-sync";
import styled from "styled-components";
import { RWD } from "../../constant";
import { useMeet } from "../../containers/hooks/useMeet";
import slotIDProcessing from "../../util/slotIDProcessing";
const { RWDFontSize, RWDHeight, RWDWidth } = RWD;

const VotingContainer = Object.assign(
  styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: ${RWDWidth(840)};
    max-height: ${RWDHeight(700)};
    overflow-x: auto;
    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  `,
  {
    /**
     * @example
     * const DayContainer = styled.div`
         display: flex;
        max-width: 100%;
        position: relative;
        height: fit-content;
        flex-shrink: 0;
        column-gap: ${RWDWidth(5)};
        overflow-x: auto;
        &::-webkit-scrollbar {
        display: none;
        }
        -ms-overflow-style: none;
        scrollbar-width: none;
    `;
    */
    DayContainer: Object.assign(
      styled.div`
        display: flex;
        max-width: 100%;
        position: relative;
        height: fit-content;
        flex-shrink: 0;
        column-gap: 20px;
        overflow-x: auto;
        &::-webkit-scrollbar {
          display: none;
        }
        -ms-overflow-style: none;
        scrollbar-width: none;
      `,
      {
        /**
         * @example
         * const TimeContainer = styled.div`
             font-size: ${RWDFontSize(12)};
            position: sticky;
            left: 0;
            border-top: ${RWDHeight(20)} solid #ffffff;
            background-color: white;
        `;
        */
        TimeContainer: styled.span`
          font-size: ${RWDFontSize(12)};
          position: sticky;
          left: 0;
          border-top: ${RWDHeight(20)} solid #ffffff;
          background-color: white;
        `,
        /**
         * @example
         * const CellContainer = styled.div`
             width: ${RWDWidth(50)};
            font-size: ${RWDFontSize(14)};
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-shrink: 0;
        `;
        */
        CellContainer: styled.div`
          width: ${RWDWidth(50)};
          font-size: ${RWDFontSize(14)};
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        `,
      }
    ),
  }
);

const { DayContainer } = VotingContainer;

export default ({ DATERANGE, TIMESLOTIDS, Cells }) => {
  const {
    moment: { Moment },
  } = useMeet();
  /*first "time" padding top*/
  const WeekDayRef = useRef(); //偵測星期三的高度與寬度
  const [paddingTop, setPaddingTop] = useState(17);
  const throttledHandleResize = _.throttle(() => {
    if (WeekDayRef?.current) {
      setPaddingTop(WeekDayRef?.current.offsetHeight);
    }
  }, 100);

  useEffect(() => {
    if (WeekDayRef?.current) {
      setPaddingTop(WeekDayRef?.current.offsetHeight);
    } //load 時
    window.addEventListener("resize", throttledHandleResize);
    return () => {
      window.removeEventListener("resize", throttledHandleResize);
    };
  }, [WeekDayRef.current, TIMESLOTIDS]);
  /******************************************************/

  return (
    <VotingContainer>
      <ScrollSyncPane>
        <VotingContainer.DayContainer>
          <DayContainer.TimeContainer
            style={{
              paddingTop: `calc(${paddingTop}px + ${RWDHeight(6)})`,
              border: "none",
            }}
          >
            {slotIDProcessing(TIMESLOTIDS[0])}
          </DayContainer.TimeContainer>
          {DATERANGE.map((w, index) => (
            <DayContainer.CellContainer key={index}>
              <div
                style={{
                  userSelect: "none",
                  width: "max-content",
                }}
                ref={WeekDayRef}
              >
                {Moment(w).format("MMM D")}
              </div>
              <div
                style={{
                  userSelect: "none",
                  fontWeight: "bold",
                }}
              >
                {Moment(w).format("ddd")}
              </div>
            </DayContainer.CellContainer>
          ))}
        </VotingContainer.DayContainer>
      </ScrollSyncPane>

      {TIMESLOTIDS.slice(1).map((t, t_index) => (
        <ScrollSyncPane key={t_index}>
          <VotingContainer.DayContainer>
            <DayContainer.TimeContainer>
              {slotIDProcessing(t)}
            </DayContainer.TimeContainer>
            {DATERANGE.map((date, d_index) => (
              <DayContainer.CellContainer key={d_index}>
                {t_index !== TIMESLOTIDS.length - 1 && Cells[d_index][t_index]}
              </DayContainer.CellContainer>
            ))}
          </VotingContainer.DayContainer>
        </ScrollSyncPane>
      ))}
    </VotingContainer>
  );
};
