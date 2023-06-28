/*TODO:********************************************************************************************
  1. RWD, 版面縮小到一定程度時兩個 component 會重疊。  
**************************************************************************************************/
import { motion } from "framer-motion";
import _ from "lodash";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ScrollSync } from "react-scroll-sync";
import Error from "./Error";
import { useMeet } from "./hooks/useMeet";
import Base from "../components/Base/145MeetRelated";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Vote from "../components/Vote";
import TimeCell from "../components/TimeCell";
import { RWD, COLORS, PAGE_TRANSITION } from "../constant";
const { ContentContainer } = Base.FullContainer;
const BackButton = Button("back");
const PillButton = Button("pill");
const InfoTooltip = Modal("info");
const { RWDWidth } = RWD;
const DraggableCell = TimeCell("draggable");
const InfoCell = TimeCell("info");
const VoteOverflowX = Vote(["x"]);

const Voting = () => {
  const [title, setTitle] = useState("");
  const [DATERANGE, setDATERANGE] = useState([]);
  const [TIMESLOTIDS, setTIMESLOTIDS] = useState([]);
  const [groupAvailabilityInfo, setGroupAvailabilityInfo] = useState([]);
  const [CELLCOLOR, setCELLCOLOR] = useState([]);
  const [ROUTINE, setROUTINE] = useState("");
  const [undo, setUndo] = useState([]);
  const [redo, setRedo] = useState([]);
  const [initialCell, setInitialCell] = useState([]);

  /*可拖曳 time cell 套組*/
  const [cell, setCell] = useState([]);
  const [block, setBlock] = useState(false);
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
    block,
    setBlock,
    setStartIndex,
    mode,
    setMode,
    setUpdatedCell,
    oriCell,
  };
  /******************************************************/

  const { code } = useParams();
  const {
    login,
    loading,
    setLoading,
    MIDDLEWARE: {
      getGroupAvailability,
      getMyAvailability,
      addMyAvailability,
      deleteMyAvailability,
      getMeetInfo,
      getRoutine,
    },
    moment: { Moment, moment },
  } = useMeet();

  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleMeetInfo = async () => {
    try {
      setLoading(true);
      const { data: votingData } = await getGroupAvailability(code);
      setGroupAvailabilityInfo(votingData.data);

      if (login) {
        const { data: routine } = await getRoutine();
        setROUTINE(routine);
      } else {
        setROUTINE([]);
      }

      const { data } = await getMeetInfo(code);
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
    } catch (error) {}
  };

  useEffect(() => {
    (async () => {
      if (DATERANGE.length && TIMESLOTIDS.length && ROUTINE) {
        const { data: myAvailability, error } = await getMyAvailability(
          code,
          location?.state?.guestName,
          location?.state?.guestPassword
        );
        if (error) {
          setError(error);
          setExist(false);
          return;
        }
        const temp = DATERANGE.map((w) =>
          TIMESLOTIDS.map((t) =>
            myAvailability.find((d) => d.date === w && d.time_slot_id === t)
              ? true
              : ROUTINE.find(
                  (r) =>
                    r.weekday === Moment(w).format("ddd").toUpperCase() &&
                    r.time_slot_id === t
                )
              ? null
              : false
          )
        );
        setInitialCell(temp);
        setCell(temp);
        setLoading(false);
      }
    })();
  }, [DATERANGE, TIMESLOTIDS]);

  useEffect(() => {
    if (groupAvailabilityInfo.length) {
      const allMembersNum =
        groupAvailabilityInfo?.[0]?.available_members.length +
        groupAvailabilityInfo?.[0]?.unavailable_members.length;
      const gap =
        Math.floor(allMembersNum / 5) < 1 ? 1 : Math.floor(allMembersNum / 5);
      setCELLCOLOR(
        groupAvailabilityInfo.map(
          (v) => COLORS.orange[Math.ceil(v.available_members.length / gap)]
        )
      );
    }
  }, [groupAvailabilityInfo]); //設定 time cell 顏色

  /*檢驗身分*/
  const [exist, setExist] = useState(undefined); // meet是否存在
  const {
    USERINFO: { ID },
    error,
    setError,
  } = useMeet();

  useEffect(() => {
    (async () => {
      if (code && exist) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await handleMeetInfo();
        setLoading(false);
      }
    })();
  }, [code, ID, exist]);

  useEffect(() => {
    (async () => {
      if (exist === undefined) {
        const { error } = await getMeetInfo(code);
        if (error) {
          setError(error);
          setExist(false);
          return;
        }
        setError("");
        setExist(true);
      }
    })();
  }, []);
  /******************************************************/

  const handleCellMouseUp = async (e) => {
    e.preventDefault();
    try {
      if (!updatedCell) {
        return;
      }
      setStartDrag(false);
      const API = mode ? addMyAvailability : deleteMyAvailability;
      setUndo((prev) => [
        {
          api: mode ? "add" : "delete",
          data: {
            time_slots: updatedCell.map((u) => ({
              date: DATERANGE[u[0]],
              time_slot_id: TIMESLOTIDS[u[1]],
            })),
            name: location?.state?.guestName ?? null,
            password: location?.state?.guestPassword ?? null,
          },
        },
        ...prev,
      ]);
      await API(code, {
        time_slots: updatedCell.map((u) => ({
          date: DATERANGE[u[0]],
          time_slot_id: TIMESLOTIDS[u[1]],
        })),
        name: location?.state?.guestName ?? null,
        password: location?.state?.guestPassword ?? null,
      });
      const { data: votingData } = await getGroupAvailability(code);
      setGroupAvailabilityInfo(votingData.data);
    } catch (error) {
      throw error;
    } finally {
      setUpdatedCell("");
    }
  };

  const handleUndoRedo = async (e) => {
    let opr;
    if (e.ctrlKey) {
      switch (e.key) {
        case "\u001a":
          if (undo.length) {
            opr = undo[0];
            setRedo((prev) => [undo[0], ...prev]);
            setUndo((prev) => prev.slice(1));
          }
          break;
        // case "\u0019":
        //   if (redo.length) {
        //     opr = redo[0];
        //     setUndo((prev) => [redo[0], ...prev]);
        //     setRedo((prev) => prev.slice(1));
        //   }
        //   break;
        default:
          break;
      }
    }
    if (opr && !loading) {
      try {
        let API;
        setLoading(true);
        const { api, data } = opr;
        if (e.key === "\u001a") {
          API = api === "delete" ? addMyAvailability : deleteMyAvailability;
        } else {
          API = api === "delete" ? deleteMyAvailability : addMyAvailability;
        }
        await API(code, data);
        const { data: votingData } = await getGroupAvailability(code);
        setGroupAvailabilityInfo(votingData.data);
        const { data: myAvailability } = await getMyAvailability(
          code,
          location?.state?.guestName,
          location?.state?.guestPassword
        );
        setCell(
          DATERANGE.map((w) =>
            TIMESLOTIDS.map((t) =>
              myAvailability.find((d) => d.date === w && d.time_slot_id === t)
                ? true
                : ROUTINE.find(
                    (r) =>
                      r.weekday === Moment(w).format("ddd").toUpperCase() &&
                      r.time_slot_id === t
                  )
                ? null
                : false
            )
          )
        );
      } catch (error) {
        alert(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const throttlehandleUndoRedo = useCallback(_.throttle(handleUndoRedo, 1000), [
    undo,
    redo,
    loading,
  ]);

  useEffect(() => {
    window.addEventListener("keypress", throttlehandleUndoRedo);
    return () => {
      window.removeEventListener("keypress", throttlehandleUndoRedo);
    };
  }, [undo, redo, loading]);

  const handleReset = async () => {
    setLoading(true);
    let add = [];
    let del = [];
    for (const d in cell) {
      for (const t in cell[d]) {
        if (cell[d][t] && !initialCell[d][t]) {
          del.push([d, t]);
        }
        if (!cell[d][t] && initialCell[d][t]) {
          add.push([d, t]);
        }
      }
    }
    await deleteMyAvailability(code, {
      time_slots: del.map((u) => ({
        date: DATERANGE[u[0]],
        time_slot_id: TIMESLOTIDS[u[1]],
      })),
      name: location?.state?.guestName ?? null,
      password: location?.state?.guestPassword ?? null,
    });
    await addMyAvailability(code, {
      time_slots: add.map((u) => ({
        date: DATERANGE[u[0]],
        time_slot_id: TIMESLOTIDS[u[1]],
      })),
      name: location?.state?.guestName ?? null,
      password: location?.state?.guestPassword ?? null,
    });
    const { data: votingData } = await getGroupAvailability(code);
    setGroupAvailabilityInfo(votingData.data);
    setUndo([]);
    setRedo([]);
    setCell(initialCell);
    setLoading(false);
  };

  return (
    exist !== undefined &&
    (error ? (
      <Error />
    ) : (
      <ScrollSync>
        <motion.div {...PAGE_TRANSITION.RightSlideIn}>
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
                  <ContentContainer.MyAvailability
                    style={{ columnGap: RWDWidth(10) }}
                  >
                    {t("myAva")}
                    <PillButton
                      variant="hollow"
                      buttonTheme="#D8D8D8"
                      onClick={handleReset}
                    >
                      Reset
                    </PillButton>
                  </ContentContainer.MyAvailability>
                  <ContentContainer.GroupAvailability>
                    {t("groupAva")}
                  </ContentContainer.GroupAvailability>
                  <ContentContainer.MyAvailability.VotingArea>
                    <VoteOverflowX
                      DATERANGE={DATERANGE}
                      TIMESLOTIDS={TIMESLOTIDS}
                      Cells={DATERANGE.map((_, d_index) =>
                        TIMESLOTIDS.map((_, t_index) => (
                          <DraggableCell
                            style={{
                              background:
                                cell[d_index][t_index] === null
                                  ? "#808080"
                                  : cell[d_index][t_index]
                                  ? "#94C9CD"
                                  : "#F0F0F0",
                            }}
                            drag={drag}
                            index={[d_index, t_index]}
                            key={t_index}
                          />
                        ))
                      )}
                    />
                  </ContentContainer.MyAvailability.VotingArea>
                  <ContentContainer.MyAvailability.VotingArea
                    style={{ gridColumn: "2/3" }}
                  >
                    <VoteOverflowX
                      DATERANGE={DATERANGE}
                      TIMESLOTIDS={TIMESLOTIDS}
                      Cells={DATERANGE.map((_, d_index) =>
                        TIMESLOTIDS.map((_, t_index) => (
                          <InfoCell
                            key={t_index}
                            style={{
                              backgroundColor:
                                CELLCOLOR[
                                  d_index * (TIMESLOTIDS.length - 1) + t_index
                                ],
                            }}
                            info={
                              <InfoTooltip
                                available_members={
                                  groupAvailabilityInfo?.[
                                    d_index * (TIMESLOTIDS.length - 1) + t_index
                                  ]?.available_members
                                }
                                unavailable_members={
                                  groupAvailabilityInfo?.[
                                    d_index * (TIMESLOTIDS.length - 1) + t_index
                                  ]?.unavailable_members
                                }
                              />
                            }
                          />
                        ))
                      )}
                    />
                  </ContentContainer.MyAvailability.VotingArea>
                </Base.FullContainer.ContentContainer>
              )}
            </Base.FullContainer>
          </Base>
        </motion.div>
      </ScrollSync>
    ))
  );
};

export default Voting;
