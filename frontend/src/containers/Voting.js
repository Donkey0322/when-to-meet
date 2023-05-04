/*TODO:********************************************************************************************
  1. RWD, 版面縮小到一定程度時兩個 component 會重疊。  
**************************************************************************************************/
import { motion } from "framer-motion";
import _ from "lodash";
import Moment from "moment";
import { extendMoment } from "moment-range";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScrollSync, ScrollSyncPane } from "react-scroll-sync";
import { useMeet } from "./hooks/useMeet";
import { RWD, COLORS } from "../constant";
import Base from "../components/Base/145MeetRelated";
import Button from "../components/Button";
import TimeCell, { slotIDProcessing } from "../components/TimeCell";
import { useTranslation } from "react-i18next";
import {
  getGroupAvailability,
  getMyAvailability,
  addMyAvailability,
  deleteMyAvailability,
  meet,
  getRoutine,
} from "../middleware";
const getMeetInfo = meet("read");
const BackButton = Button("back");
const { ContentContainer } = Base.FullContainer;
const {
  GroupAvailability: {
    VotingContainer: {
      DayContainer: { CellHoverContainer },
    },
  },
} = ContentContainer;
const { RWDWidth } = RWD;
const DraggableCell = TimeCell("draggable");
const InfoCell = TimeCell("info");
const moment = extendMoment(Moment);

const xOffset = 100;
const variants = {
  enter: (direction) => ({
    x: direction > 0 ? xOffset : -xOffset,
    opacity: 0,
  }),
  active: {
    x: 0,
    opacity: 1,
    transition: { delay: 0.2 },
  },
  exit: (direction) => ({
    x: direction > 0 ? -xOffset : xOffset,
    opacity: 0,
  }),
};

const Voting = () => {
  const [title, setTitle] = useState("");
  const [DATERANGE, setDATERANGE] = useState([]);
  const [TIMESLOTIDS, setTIMESLOTIDS] = useState([]);
  const [VOTINGINFO, setVOTINGINFO] = useState([]);
  const [CELLCOLOR, setCELLCOLOR] = useState([]);
  const [ROUTINE, setROUTINE] = useState("");

  /*調整 time gap 套組*/
  const WeekdayRef = useRef(null); //追蹤天數高度
  const TimeCellRef = useRef(null); //追蹤 TimeCell 高度
  const TimeRef = useRef(null);
  const [timeTop, setTimeTop] = useState(0);
  /******************************************************/

  /*可拖曳 time cell 套組*/
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
    setVOTINGINFO,
  };
  /******************************************************/

  const { code } = useParams();
  const { cookies, login, setLoading } = useMeet();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleMeetInfo = async () => {
    try {
      setLoading(true);
      const { data: votingData } = await getGroupAvailability(
        code,
        cookies.token
      );
      setVOTINGINFO(votingData.data);

      const { data: routine } = await getRoutine(undefined, cookies.token);
      setROUTINE(routine);

      const { data } = await getMeetInfo(code, cookies.token);
      setTitle(data.meet_name);
      setDATERANGE(
        [
          ...moment
            .range(moment(data.start_date), moment(data.end_date))
            .by("day"),
        ].map((m) => m.format("YYYY-MM-DD"))
      );
      setTIMESLOTIDS(
        _.range(data.start_time_slot_id, data.end_time_slot_id + +2)
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    (async () => {
      if (DATERANGE.length && TIMESLOTIDS.length && ROUTINE) {
        const { data: myAvailability } = await getMyAvailability(
          code,
          cookies.token
        );
        setCell(
          DATERANGE.map((w) =>
            TIMESLOTIDS.map((t) =>
              myAvailability.find((d) => d.date === w && d.time_slot_id === t)
                ? true
                : ROUTINE.find(
                    (r) =>
                      r.weekday === moment(w).format("ddd").toUpperCase() &&
                      r.time_slot_id === t
                  )
                ? null
                : false
            )
          )
        );
        setLoading(false);
      }
    })();
  }, [DATERANGE, TIMESLOTIDS]);

  useEffect(() => {
    if (code) {
      handleMeetInfo();
    }
  }, [code]);

  useEffect(() => {
    if (VOTINGINFO.length) {
      const allMembersNum =
        VOTINGINFO?.[0]?.available_members.length +
        VOTINGINFO?.[0]?.unavailable_members.length;
      const gap =
        Math.floor(allMembersNum / 5) < 1 ? 1 : Math.floor(allMembersNum / 5);
      setCELLCOLOR(
        VOTINGINFO.map(
          (v) => COLORS.orange[Math.ceil(v.available_members.length / gap)]
        )
      );
    }
  }, [VOTINGINFO]); //設定 time cell 顏色

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
  }, [cell]);

  const handleCellMouseUp = async (e) => {
    e.preventDefault();
    try {
      if (!updatedCell) {
        return;
      }
      setStartDrag(false);
      const API = mode ? addMyAvailability : deleteMyAvailability;
      await API(
        code,
        {
          time_slots: updatedCell.map((u) => ({
            date: DATERANGE[u[0]],
            time_slot_id: u[1] + 1,
          })),
        },
        cookies.token
      );
      const { data: votingData } = await getGroupAvailability(
        code,
        cookies.token
      );
      setVOTINGINFO(votingData.data);
    } catch (error) {
      throw error;
    } finally {
      setUpdatedCell("");
    }
  };
  console.log(window.innerWidth);
  return (
    <ScrollSync>
      <motion.div
        initial={{ x: 1000 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <Base login={login} onMouseUp={handleCellMouseUp}>
          <Base.FullContainer>
            {cell.length > 0 && (
              <Base.FullContainer.ContentContainer>
                <ContentContainer.Title>
                  <BackButton
                    style={{
                      position: "absolute",
                      right: "100%",
                      marginRight: RWDWidth(30),
                    }}
                    onClick={() => {
                      navigate(`/meets/${code}`);
                    }}
                  ></BackButton>
                  {title}
                </ContentContainer.Title>
                <ContentContainer.MyAvailability>
                  {t("myAva")}
                </ContentContainer.MyAvailability>
                <ContentContainer.GroupAvailability>
                  {t("groupAva")}
                </ContentContainer.GroupAvailability>
                <ContentContainer.MyAvailability.VotingContainer>
                  <ContentContainer.MyAvailability.VotingContainer.TimeContainer
                    style={{
                      marginTop: `${timeTop - 3}px`,
                    }}
                  >
                    {TIMESLOTIDS.map((m, index) => (
                      <div ref={TimeRef} key={index}>
                        {slotIDProcessing(m)}
                      </div>
                    ))}
                  </ContentContainer.MyAvailability.VotingContainer.TimeContainer>
                  <ScrollSyncPane>
                    <ContentContainer.MyAvailability.VotingContainer.CellsContainer>
                      {DATERANGE.map((m, d_index) => (
                        <ContentContainer.MyAvailability.VotingContainer.CellsContainer.DayColumn
                          key={d_index}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                            ref={WeekdayRef}
                          >
                            <div style={{ userSelect: "none" }}>
                              {moment(m).format("MMM D")}
                            </div>
                            <div
                              style={{ userSelect: "none", fontWeight: "700" }}
                            >
                              {moment(m).format("ddd")}
                            </div>
                          </div>
                          {TIMESLOTIDS.map(
                            (_, t_index) =>
                              t_index !== TIMESLOTIDS.length - 1 && (
                                <DraggableCell
                                  style={{
                                    background:
                                      cell[d_index][t_index] === null
                                        ? "#808080"
                                        : cell[d_index][t_index]
                                        ? "#94C9CD"
                                        : "#F0F0F0",
                                  }}
                                  // ref={t === 43 ? ref : null}
                                  drag={drag}
                                  index={[d_index, t_index]}
                                  key={t_index}
                                  ref={TimeCellRef}
                                />
                              )
                          )}
                        </ContentContainer.MyAvailability.VotingContainer.CellsContainer.DayColumn>
                      ))}
                    </ContentContainer.MyAvailability.VotingContainer.CellsContainer>
                  </ScrollSyncPane>
                </ContentContainer.MyAvailability.VotingContainer>
                <ContentContainer.MyAvailability.VotingContainer
                  style={{ gridColumn: "2/3" }}
                >
                  <ContentContainer.MyAvailability.VotingContainer.TimeContainer
                    style={{
                      marginTop: `${timeTop - 3}px`,
                    }}
                  >
                    {TIMESLOTIDS.map((m, index) => (
                      <div ref={TimeRef} key={index}>
                        {slotIDProcessing(m)}
                      </div>
                    ))}
                  </ContentContainer.MyAvailability.VotingContainer.TimeContainer>
                  <ScrollSyncPane>
                    <ContentContainer.MyAvailability.VotingContainer.CellsContainer>
                      {DATERANGE.map((m, d_index) => (
                        <ContentContainer.MyAvailability.VotingContainer.CellsContainer.DayColumn
                          key={d_index}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                            ref={WeekdayRef}
                          >
                            <div style={{ userSelect: "none" }}>
                              {moment(m).format("MMM D")}
                            </div>
                            <div
                              style={{ userSelect: "none", fontWeight: "700" }}
                            >
                              {moment(m).format("ddd")}
                            </div>
                          </div>
                          {TIMESLOTIDS.map(
                            (_, t_index) =>
                              t_index !== TIMESLOTIDS.length - 1 && (
                                <InfoCell
                                  key={t_index}
                                  style={{
                                    backgroundColor:
                                      CELLCOLOR[
                                        d_index * (TIMESLOTIDS.length - 1) +
                                          t_index
                                      ],
                                  }}
                                  info={
                                    <CellHoverContainer>
                                      <CellHoverContainer.CellHoverInfo>
                                        <div
                                          style={{
                                            fontWeight: "bold",
                                            textDecoration: "underline",
                                          }}
                                        >
                                          Availble
                                        </div>
                                        {VOTINGINFO?.[
                                          d_index * (TIMESLOTIDS.length - 1) +
                                            t_index
                                        ]?.available_members.map((m, index) => (
                                          <div key={index}>{m}</div>
                                        ))}
                                      </CellHoverContainer.CellHoverInfo>
                                      <CellHoverContainer.CellHoverInfo>
                                        <div
                                          style={{
                                            fontWeight: "bold",
                                            textDecoration: "underline",
                                          }}
                                        >
                                          Unavailble
                                        </div>
                                        {VOTINGINFO?.[
                                          d_index * (TIMESLOTIDS.length - 1) +
                                            t_index
                                        ]?.unavailable_members.map(
                                          (m, index) => (
                                            <div key={index}>{m}</div>
                                          )
                                        )}
                                      </CellHoverContainer.CellHoverInfo>
                                    </CellHoverContainer>
                                  }
                                />
                              )
                          )}
                        </ContentContainer.MyAvailability.VotingContainer.CellsContainer.DayColumn>
                      ))}
                    </ContentContainer.MyAvailability.VotingContainer.CellsContainer>
                  </ScrollSyncPane>
                </ContentContainer.MyAvailability.VotingContainer>
              </Base.FullContainer.ContentContainer>
            )}
          </Base.FullContainer>

          {/* <div style={{ width: "100%", position: "relative" }}>
          <div
            style={{
              borderLeft: "1px #000000 dashed",
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <NameWrapper>
              <div
                style={{
                  fontFamily: "Roboto",
                  fontStyle: "normal",
                  fontWeight: "500",
                  fontSize: "calc(100vmin * 30 / 1080)",
                }}
              >
                SDM Class
              </div>
            </NameWrapper>
            <FormWrapper onMouseUp={handleCellMouseUp}>
              <div
                style={{
                  fontFamily: "Roboto",
                  fontWeight: "500",
                  fontSize: "20px",
                }}
              >
                My Availability
              </div>
              <div
                style={{
                  display: "flex",
                  columnGap: "2px",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <DayColumn
                  style={{
                    alignItems: "flex-end",
                    marginRight: "5px",
                    marginTop: "-10px",
                  }}
                >
                  <div style={{ opacity: "0" }}>Mar 29</div>
                  <div style={{ opacity: "0" }}>Wed</div>
                  {TIMESLOTIDS.map((t, Tindex) => (
                    <div
                      key={Tindex}
                      style={{
                        height: "20px",
                        userSelect: startDrag ? "none" : "text",
                      }}
                    >
                      {slotIDProcessing(t)}
                    </div>
                  ))}
                </DayColumn>
                <ScrollSyncPane>
                  <div
                    style={{
                      display: "flex",
                      columnGap: "2px",
                      overflowX: "auto",
                      maxWidth: "80%",
                    }}
                    onScroll={(e) => {
                      console.log(e.target);
                    }}
                  >
                    {DATERANGE.map((date, c_index) => (
                      <DayColumn key={c_index}>
                        <div style={{ userSelect: "none" }}>
                          {moment(date).format("MMM DD")}
                        </div>
                        <div style={{ userSelect: "none" }}>
                          {moment(date).format("ddd")}
                        </div>
                        {TIMESLOTIDS.slice(0, -1).map((_, r_index) => (
                          <Cell
                            key={r_index}
                            style={{
                              background: cell[c_index][r_index]
                                ? "#94C9CD"
                                : "#F0F0F0",
                            }}
                            onMouseDown={handleCellMouseDown([
                              c_index,
                              r_index,
                            ])}
                            onMouseEnter={handleCellMouseEnter([
                              c_index,
                              r_index,
                            ])}
                            onClick={handleCellClick([c_index, r_index])}
                          />
                        ))}
                      </DayColumn>
                    ))}
                  </div>
                </ScrollSyncPane>
              </div>
            </FormWrapper>
          </div>
        </div> */}
        </Base>
      </motion.div>
    </ScrollSync>
  );
};

export default Voting;
