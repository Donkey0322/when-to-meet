/*TODO:********************************************************************************************
  1. RWD, 版面縮小到一定程度時兩個 component 會重疊。  
**************************************************************************************************/
import { motion } from "framer-motion";
import _ from "lodash";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ScrollSync } from "react-scroll-sync";
import { useMeet } from "./hooks/useMeet";
import { RWD, COLORS, PAGE_TRANSITION } from "../constant";
import Base from "../components/Base/145MeetRelated";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Vote from "../components/Vote";
import TimeCell, { slotIDProcessing } from "../components/TimeCell";
import Error from "./Error";
const { ContentContainer } = Base.FullContainer;
const BackButton = Button("back");
const ConfirmModal = Modal("confirm");
const InfoTooltip = Modal("info");
const { RWDWidth } = RWD;
const ConfirmCell = TimeCell("confirm");
const VoteOverflowX = Vote(["x"]);

const Voting = () => {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [DATERANGE, setDATERANGE] = useState([]);
  const [TIMESLOTIDS, setTIMESLOTIDS] = useState([]);
  const [CELLCOLOR, setCELLCOLOR] = useState([]);
  const [open, setOpen] = useState(false);

  /*可拖曳 time cell 套組*/
  const [block, setBlock] = useState(false);
  const [cell, setCell] = useState([]);
  const [mode, setMode] = useState(true); //選取模式
  const [startDrag, setStartDrag] = useState(false); //啟動拖曳事件
  const [startIndex, setStartIndex] = useState([]); //選取方塊位置
  const [updatedCell, setUpdatedCell] = useState("");
  const [groupAvailabilityInfo, setGroupAvailabilityInfo] = useState([]);
  const oriCell = useMemo(() => cell, [startDrag]);
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
    setLoading,
    lang,
    MIDDLEWARE: { getGroupAvailability, confirmMeet, getMeetInfo },
    moment: { Moment, moment },
  } = useMeet();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleMeetInfo = async () => {
    try {
      setLoading(true);
      const { data: votingData } = await getGroupAvailability(code);
      setGroupAvailabilityInfo(votingData.data);

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
      if (DATERANGE.length && TIMESLOTIDS.length) {
        setCell(DATERANGE.map(() => TIMESLOTIDS.map(() => false)));
        setLoading(false);
      }
    })();
  }, [DATERANGE, TIMESLOTIDS]);

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

  const handleCellMouseUp = async (e) => {
    e.preventDefault();
    try {
      if (!updatedCell) {
        return;
      }
      setTime(
        `${Moment(DATERANGE[updatedCell?.[0]?.[0]], "YYYY-MM-DD").format(
          "MMM D"
        )} ${slotIDProcessing(
          TIMESLOTIDS[updatedCell?.[0]?.[1]]
        )} ~ ${slotIDProcessing(
          TIMESLOTIDS[updatedCell?.[updatedCell?.length - 1]?.[1] + 1]
        )}`
      );
      setStartDrag(false);
      setOpen(true);
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = () => {
    setUpdatedCell("");
    setCell(DATERANGE.map(() => TIMESLOTIDS.map(() => false)));
    setOpen(false);
  };

  const handleConfirm = async () => {
    try {
      await confirmMeet(code, {
        start_date: DATERANGE[updatedCell[0][0]],
        end_date: DATERANGE[updatedCell[0][0]],
        start_time_slot_id: TIMESLOTIDS[updatedCell?.[0]?.[1]],
        end_time_slot_id:
          TIMESLOTIDS[updatedCell?.[updatedCell?.length - 1]?.[1]],
      });
      navigate(`/meets/${code}`);
    } catch (error) {}
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
                <Base.FullContainer.ContentContainer
                  style={{ gridTemplateColumns: "8fr 1fr" }}
                >
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
                    {t("groupAva")}
                  </ContentContainer.MyAvailability>
                  <ContentContainer.MyAvailability.VotingArea
                    style={{ gridColumn: "1/2" }}
                  >
                    <VoteOverflowX
                      DATERANGE={DATERANGE}
                      TIMESLOTIDS={TIMESLOTIDS}
                      Cells={DATERANGE.map((_, d_index) =>
                        TIMESLOTIDS.map((_, t_index) => (
                          <ConfirmCell
                            drag={drag}
                            index={[d_index, t_index]}
                            key={t_index}
                            style={{
                              backgroundColor: cell[d_index][t_index]
                                ? "#F25C54"
                                : CELLCOLOR[
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

              <ConfirmModal
                open={open}
                setOpen={setOpen}
                meetName={title}
                time={time}
                onCancel={handleCancel}
                onOk={handleConfirm}
              />
            </Base.FullContainer>
          </Base>
        </motion.div>
      </ScrollSync>
    ))
  );
};

export default Voting;
