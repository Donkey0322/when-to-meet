/*TODO:********************************************************************************************
  1. RWD, 頁面縮過小時的錯誤
  2. RWD, 高度縮小「有時」scrollBar 會跑出來造成頁面錯誤
**************************************************************************************************/
import _ from "lodash";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useMeet } from "../hooks/useMeet";
import Base from "../../components/Base/orange3_white7";
import TimeCell, { slotIDProcessing } from "../../components/TimeCell";
import { RWD } from "../../constant";
import { getRoutine, addRoutine, deleteRoutine } from "../../middleware";
const { RWDHeight, RWDFontSize, RWDWidth } = RWD;
const DraggableCell = TimeCell("draggable");

const InfoContainer = Object.assign(
  styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
  `,
  {
    TimeCellsContainer: Object.assign(
      styled.div`
        display: flex;
        justify-content: flex-end;
        column-gap: ${RWDWidth(24)};
        width: ${RWDWidth(600)};
        padding-top: ${RWDHeight(11)};
        max-height: 80vh;
        overflow-y: scroll;
        &::-webkit-scrollbar {
          display: none;
        }
        -ms-overflow-style: none;
        scrollbar-width: none;
      `,
      {
        DayColumn: Object.assign(
          styled.div`
            display: flex;
            flex-direction: column;
            row-gap: ${RWDHeight(5)};
            width: ${RWDWidth(50)};
          `,
          {
            TimeContainer: styled.div`
              position: absolute;
              left: min(${RWDWidth(-45)}, -50px);
              top: ${RWDHeight(-12)};
            `,
          }
        ),
      }
    ),
    WeekContainer: Object.assign(
      styled.div`
        display: flex;
        align-items: center;
        column-gap: ${RWDWidth(24)};
        justify-content: flex-end;
        width: ${RWDWidth(600)};
      `,
      {
        WeekDayContainer: styled.div`
          width: ${RWDWidth(50)};
          font-size: ${RWDFontSize(24)};
          text-align: center;
        `,
      }
    ),
  }
);

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIMESLOTIDS = _.range(1, 50); //記得加 1

const Routine = () => {
  const { cookies, login } = useMeet();
  const navigate = useNavigate();

  const [cell, setCell] = useState([]);
  const [startDrag, setStartDrag] = useState(false); //啟動拖曳事件
  const [startIndex, setStartIndex] = useState([]); //選取方塊位置
  const oriCell = useMemo(() => cell, [startDrag]);
  const [updatedCell, setUpdatedCell] = useState("");
  const [mode, setMode] = useState(true); //選取模式
  const drag = {
    cell,
    setCell,
    startDrag,
    setStartDrag,
    startIndex,
    setStartIndex,
    mode,
    setMode,
    setUpdatedCell,
    oriCell,
  };

  useEffect(() => {
    (async () => {
      try {
        if (!login) {
          navigate("/");
        } else {
          const { data } = await getRoutine(undefined, cookies.token);
          setCell(
            WEEKDAYS.map((w) =>
              TIMESLOTIDS.map((t) =>
                Boolean(
                  data.find(
                    (d) => d.weekday === w.toUpperCase() && d.time_slot_id === t
                  )
                )
              )
            )
          );
        }
      } catch (error) {
        console.log(error);
      }
    })();
  }, [login]);

  const ref = useRef(null); //讓頁面自動滾
  // useEffect(() => {
  //   if (ref?.current && cell.length > 0 && !startDrag) {
  //     ref.current.scrollIntoView({
  //       behavior: "smooth",
  //       block: "nearest",
  //       inline: "start",
  //     });
  //   }
  // }, [ref, cell]);

  const handleCellMouseUp = async (e) => {
    e.preventDefault();
    try {
      if (!updatedCell) {
        return;
      }
      setStartDrag(false);
      const API = mode ? addRoutine : deleteRoutine;
      await API(
        updatedCell.map((u) => ({
          weekday: WEEKDAYS[u[0]].toUpperCase(),
          time_slot_id: u[1] + 1,
        })),
        cookies.token
      );
    } catch (error) {
      throw error;
    } finally {
      setUpdatedCell("");
    }
  };

  return (
    <Base login={true} title_disable={true} onMouseUp={handleCellMouseUp}>
      <Base.LeftContainer
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontSize: "3vmin",
            color: "#B76A00",
            margin: 0,
            fontWeight: 600,
            letterSpacing: "1px",
          }}
        >
          How does routine work?
        </p>
      </Base.LeftContainer>
      <Base.RightContainer style={{ gridRow: "2/3", position: "relative" }}>
        {cell.length > 0 && (
          <InfoContainer>
            <InfoContainer.WeekContainer>
              {WEEKDAYS.map((w, w_index) => (
                <InfoContainer.WeekContainer.WeekDayContainer key={w_index}>
                  {w}
                </InfoContainer.WeekContainer.WeekDayContainer>
              ))}
            </InfoContainer.WeekContainer>
            <InfoContainer.TimeCellsContainer>
              {WEEKDAYS.map((_, w_index) => (
                <InfoContainer.TimeCellsContainer.DayColumn key={w_index}>
                  {TIMESLOTIDS.map((t, t_index) => (
                    <div
                      key={t_index}
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        // whiteSpace: "nowrap",
                        position: "relative",
                      }}
                    >
                      {w_index === 0 && (
                        <InfoContainer.TimeCellsContainer.DayColumn.TimeContainer>
                          {slotIDProcessing(t)}
                        </InfoContainer.TimeCellsContainer.DayColumn.TimeContainer>
                      )}
                      {t_index !== TIMESLOTIDS.length - 1 && (
                        <DraggableCell
                          style={{
                            background: cell[w_index][t_index]
                              ? "#808080"
                              : "#F0F0F0",
                          }}
                          ref={t === 43 ? ref : null}
                          drag={drag}
                          index={[w_index, t_index]}
                        />
                      )}
                    </div>
                  ))}
                </InfoContainer.TimeCellsContainer.DayColumn>
              ))}
            </InfoContainer.TimeCellsContainer>
          </InfoContainer>
        )}
      </Base.RightContainer>
    </Base>
  );
};

export default Routine;
