/*TODO:********************************************************************************************
  1. 更新時 voting end time 和 description 的資料型態
**************************************************************************************************/
import { EditFilled, CopyOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { motion } from "framer-motion";
import _ from "lodash";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ScrollSync } from "react-scroll-sync";
import Error from "./Error";
import { useMeet } from "./hooks/useMeet";
import Base from "../components/Base/145MeetRelated";
import Button from "../components/Button";
import MeetInfoEdit from "../components/MeetInfo";
import Modal from "../components/Modal";
import Notification from "../components/Notification";
import Tag from "../components/Tag";
import TimeCell, { slotIDProcessing } from "../components/TimeCell";
import Vote from "../components/Vote";
import { RWD, COLORS, PAGE_TRANSITION } from "../constant";
const BackButton = Button("back");
const RectButton = Button("rect");
const RoundButton = Button("round");
const GuestNameModal = Modal("guestName");
const ConfirmModal = Modal("confirm");
const InfoTooltip = Modal("info");
const LeaveModal = Modal("leave");
const { RWDWidth, RWDFontSize } = RWD;
const MemberTag = Tag("member");
const ConfirmCell = TimeCell("confirm");
const InfoCell = TimeCell("info");
const VoteOverflowXY = Vote(["x", "y"]);

const {
  ContentContainer,
  ContentContainer: {
    GroupAvailability: { VotingArea },
  },
} = Base.FullContainer;

const MeetInfo = () => {
  const {
    login,
    setLoading,
    USERINFO: { ID },
    error,
    setError,
    MIDDLEWARE,
    moment: { Moment, moment },
  } = useMeet();

  /*AXIOS 串接 API tool*/
  const {
    getGroupAvailability,
    getMyAvailability,
    confirmMeet,
    getMeetInfo,
    joinMeet,
    leaveMeet,
    editMeet,
  } = MIDDLEWARE;
  /******************************************************/

  // const oriRawMeetInfo = useMemo(() => rawMeetInfo, [editMode]);
  const navigate = useNavigate();
  const { code } = useParams();
  const { t } = useTranslation();

  /*檢驗身分*/
  const [exist, setExist] = useState(undefined); // meet是否存在
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

  /*main: get meet info and vote info*/
  const [elementMeetInfo, setElementMeetInfo] = useState({
    "Meet Name": "",
    "Start / End Date": "",
    "Start / End Time": "",
    Host: "",
    Member: "",
    Description: "",
    "Voting Deadline": "",
    "Invitation URL": "",
    "Google Meet URL": "",
  }); //非編輯模式下的資料
  const [CELLCOLOR, setCELLCOLOR] = useState([]); //vote info color
  const [confirmed, setConfirmed] = useState(false); //meet 的狀態 (Confirmed)
  const [confirmedTime, setConfirmedTime] = useState({ date: "", timeID: [] }); //confirmed 的時間
  const [DATERANGE, setDATERANGE] = useState([]); //meet 天數範圍
  const [groupAvailabilityInfo, setGroupAvailabilityInfo] = useState([]); //vote info
  const [host, setHost] = useState(false); //是否為 host
  const [TIMESLOTIDS, setTIMESLOTIDS] = useState([]); //meet 時間範圍
  const handleMeetInfo = async () => {
    try {
      setLoading(true);
      const { data: votingData, error } = await getGroupAvailability(code);
      if (error) throw new Error(error);

      setGroupAvailabilityInfo(votingData.data);
      const {
        data: {
          meet_name,
          start_date,
          end_date,
          start_time_slot_id,
          end_time_slot_id,
          host_info,
          member_infos,
          description,
          voting_end_time,
          invite_code,
          meet_url,
          status,
          finalized_start_date,
          finalized_start_time_slot_id,
          finalized_end_time_slot_id,
        },
      } = await getMeetInfo(code);
      setHost(ID ? host_info?.account_id === ID : false);
      setConfirmed(status === "Confirmed");
      setConfirmedTime({
        date: finalized_start_date,
        timeID: finalized_start_time_slot_id
          ? _.range(
              finalized_start_time_slot_id,
              finalized_end_time_slot_id + 1
            )
          : [],
      });
      setForMemberDataFormat(
        member_infos.map((m) => ({
          username: m.name,
          id: m.account_id,
          email: m.email,
        }))
      );
      setElementMeetInfo({
        "Meet Name": meet_name,
        "Start / End Date":
          start_date.replaceAll("-", "/") +
          " ~ " +
          end_date.replaceAll("-", "/"),
        "Start / End Time":
          slotIDProcessing(start_time_slot_id) +
          " ~ " +
          slotIDProcessing(end_time_slot_id + 1),
        Host: (
          <MemberTag style={{ fontSize: RWDFontSize(16) }}>
            {host_info?.name}
          </MemberTag>
        ),
        Member: member_infos.length ? (
          <div
            style={{
              display: "flex",
              gap: `${RWDFontSize(8)} ${RWDFontSize(8)}`,
              flexWrap: "wrap",
              width: RWDWidth(590),
              alignContent: "flex-start",
            }}
          >
            {member_infos.map((m, index) => (
              <MemberTag key={index}>{m.name}</MemberTag>
            ))}
          </div>
        ) : (
          t("none")
        ),
        Description: description ? description : t("none"),
        "Voting Deadline": voting_end_time
          ? moment(voting_end_time).format("YYYY/MM/DD HH:mm:ss")
          : t("none"),
        "Invitation URL": (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              columnGap: RWDWidth(8),
            }}
          >
            <div>
              {process.env.REACT_APP_SERVER_USE_HTTPS === "true"
                ? "https"
                : "http"}
              ://{process.env.REACT_APP_SERVER_DOMAIN}/meets/{invite_code}
            </div>
            <CopyToClipboard
              text={`${
                process.env.REACT_APP_SERVER_USE_HTTPS === "true"
                  ? "https"
                  : "http"
              }://${process.env.REACT_APP_SERVER_DOMAIN}/meets/${invite_code}`}
            >
              <Tooltip title="copy to clipboard" open={copy}>
                <RoundButton
                  variant="text"
                  buttonTheme="#D8D8D8"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    setCopy(true);
                  }}
                />
              </Tooltip>
            </CopyToClipboard>
          </div>
        ),
        "Google Meet URL": meet_url ? (
          <a
            target="_blank"
            href={meet_url}
            style={{ color: "#000000", textDecoration: "underline" }}
            rel="noreferrer"
          >
            {meet_url}
          </a>
        ) : (
          t("none")
        ),
      });
      setRawMeetInfo({
        meet_name,
        start_date,
        end_date,
        start_time_slot_id,
        end_time_slot_id,
        description: description ?? "",
        voting_end_time,
        gen_meet_url: meet_url ? true : false,
        member_ids: member_infos
          .filter((m) => m.account_id)
          .map((m) => m.account_id),
        remove_guest_names: [],
        emails: [],
      });
      setDATERANGE(
        [...moment.range(moment(start_date), moment(end_date)).by("day")].map(
          (m) => m.format("YYYY-MM-DD")
        )
      );
      setTIMESLOTIDS(_.range(start_time_slot_id, end_time_slot_id + 2));
      setLoading(false);
    } catch (error) {
      setError(error.message);
    }
  };
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
  /******************************************************/

  /*edit meet 套組*/
  const [editMode, setEditMode] = useState(false); //是否為編輯模式
  const [copy, setCopy] = useState(false); //非編輯模式下複製 invite code
  const [forMemberDataFormat, setForMemberDataFormat] = useState([]); //編輯模式下已存在 member 的資料
  const [rawMeetInfo, setRawMeetInfo] = useState({}); //編輯模式的資料
  const handleMeetDataChange =
    (func, ...name) =>
    (e) => {
      if (name.length === 1) {
        setRawMeetInfo((prev) => ({ ...prev, [name[0]]: func(e) }));
      } else {
        setRawMeetInfo((prev) => ({
          ...prev,
          [name[0]]: e ? func(e[0], 1) : null,
          [name[1]]: e ? func(e[1], 0) : null,
        }));
      }
    };
  const handleEditDone = async () => {
    try {
      await editMeet(code, rawMeetInfo);
      await handleMeetInfo();
      setLoading(false);
      setEditMode(false);
    } catch (error) {
      throw error;
    }
  };
  useEffect(() => {
    (async () => {
      if (code && exist) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await handleMeetInfo();
        setLoading(false);
      }
    })();
  }, [code, ID, exist]); //頁面 render 時 get meet info
  useEffect(() => {
    const url = `${
      process.env.REACT_APP_SERVER_USE_HTTPS === "true" ? "https" : "http"
    }://${process.env.REACT_APP_SERVER_DOMAIN}/meets/${code}`;
    setElementMeetInfo((prev) => ({
      ...prev,
      "Invitation URL": (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            columnGap: RWDWidth(8),
          }}
        >
          <div>{url}</div>
          <CopyToClipboard text={url}>
            <Tooltip title="copy to clipboard" open={copy}>
              <RoundButton
                variant="text"
                buttonTheme="#D8D8D8"
                icon={<CopyOutlined />}
                onClick={() => {
                  setCopy(true);
                }}
              />
            </Tooltip>
          </CopyToClipboard>
        </div>
      ),
    }));
    if (copy) {
      const timer = setTimeout(() => {
        setCopy(false);
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    }
  }, [copy]); //copy 轉換時重新設定非編輯模式下的資料
  /******************************************************/

  /*leave meet 套組*/
  const [leaveOpen, setLeaveOpen] = useState(false);
  const handleLeaveYes = async () => {
    try {
      setLoading(true);
      const { error } = await leaveMeet(code);
      if (!error) {
        setLoading(false);
        navigate("/meets");
      }
    } catch (error) {
      throw error;
    }
  };
  /******************************************************/

  /*guest name 套組*/
  const [form, setForm] = useState({ username: "", password: "" });
  const [guestNameOpen, setGuestNameOpen] = useState(false);
  const [notification, setNotification] = useState({}); //guest name 輸入失敗提示
  const handleFormChange = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
  };
  const handleGuestVote = async () => {
    const { username, password } = form;
    const { error } = await getMyAvailability(
      code,
      username,
      password ? password : null
    );
    if (error) {
      const { error } = await joinMeet(code, {
        name: username,
        password: password ? password : null,
      });
      if (error) {
        switch (error) {
          case "UsernameExists":
            setNotification({
              title: "Invalid username",
              message: "The username has been used in this meet.",
            });
            break;
          default:
            break;
        }
        return;
      }
    }
    navigate(`/voting/${code}`, {
      state: {
        guestName: username,
        guestPassword: password ? password : null,
      },
    });
    setGuestNameOpen(false);
  };
  /******************************************************/

  /*confirm meet time scroll 套組*/
  const confirmTimeRef = useRef(null); //讓頁面自動滾
  useEffect(() => {
    if (confirmTimeRef?.current) {
      confirmTimeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "start",
      });
    }
  }, [confirmTimeRef.current, TIMESLOTIDS]);
  /******************************************************/

  /*可拖曳 time cell 套組 for edit confirmed meet*/
  const [block, setBlock] = useState(false);
  const [cell, setCell] = useState([]);
  const [mode, setMode] = useState(true); //選取模式
  const [startDrag, setStartDrag] = useState(false); //啟動拖曳事件
  const [startIndex, setStartIndex] = useState([]); //選取方塊位置
  const [updatedCell, setUpdatedCell] = useState("");
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
  useEffect(() => {
    (async () => {
      if (DATERANGE.length && TIMESLOTIDS.length) {
        setCell(DATERANGE.map(() => TIMESLOTIDS.map(() => false)));
        setLoading(false);
      }
    })();
  }, [DATERANGE, TIMESLOTIDS]);

  const [time, setTime] = useState("");
  const [open, setOpen] = useState(false);

  const handleCellMouseUp = async (e) => {
    e.preventDefault();
    try {
      if (!updatedCell || !editMode) {
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
      await handleEditDone();
      setOpen(false);
    } catch (error) {
      throw error;
    }
  };
  /******************************************************/

  const handleVote = () => {
    if (!login) {
      setGuestNameOpen(true);
      return;
    }
    navigate(`/voting/${code}`);
  };

  return (
    exist !== undefined &&
    (error ? (
      <Error />
    ) : (
      <motion.div
      //  {...PAGE_TRANSITION.RightSlideIn}
      >
        <Notification
          notification={notification}
          setNotification={setNotification}
        />
        <Base login={login} onMouseUp={handleCellMouseUp}>
          <Base.FullContainer>
            {elementMeetInfo?.["Meet Name"] && (
              <Base.FullContainer.ContentContainer>
                <ContentContainer.Title
                  style={{ columnGap: RWDWidth(10), position: "relative" }}
                >
                  {editMode ? (
                    "Edit Meet"
                  ) : (
                    <>
                      <BackButton
                        style={{
                          position: "absolute",
                          right: "100%",
                          marginRight: RWDWidth(30),
                        }}
                        onClick={() => {
                          if (login) {
                            navigate("/meets");
                          } else {
                            navigate("/");
                          }
                        }}
                      />
                      {elementMeetInfo["Meet Name"]}
                      {host && (
                        <>
                          <EditFilled
                            onClick={() => {
                              setEditMode((prev) => !prev);
                            }}
                          />
                          {!confirmed && (
                            <RectButton
                              buttonTheme="#DB8600"
                              variant="solid"
                              onClick={() => {
                                navigate(`/confirm/${code}`);
                              }}
                              style={{ position: "absolute", right: 0 }}
                            >
                              {t("confirmMeet")}
                            </RectButton>
                          )}
                        </>
                      )}
                    </>
                  )}
                </ContentContainer.Title>
                <ContentContainer.InfoContainer>
                  <MeetInfoEdit
                    handleMeetDataChange={handleMeetDataChange}
                    columnGap={20}
                    rowGap={30}
                    login={login}
                    setMeetData={setRawMeetInfo}
                    ElementMeetInfo={elementMeetInfo}
                    rawMeetInfo={rawMeetInfo}
                    reviseMode={editMode}
                    confirmed={confirmed}
                    member={forMemberDataFormat}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      alignSelf: "flex-end",
                      columnGap: RWDWidth(15),
                    }}
                  >
                    {editMode ? (
                      <>
                        <RectButton
                          buttonTheme="#D8D8D8"
                          variant="hollow"
                          onClick={() => {
                            setEditMode(false);
                          }}
                        >
                          {t("cancel")}
                        </RectButton>
                        <RectButton
                          buttonTheme="#5A8EA4"
                          variant="solid"
                          onClick={handleEditDone}
                          disabled={
                            !rawMeetInfo.meet_name ||
                            !rawMeetInfo.start_date ||
                            !rawMeetInfo.end_date ||
                            !rawMeetInfo.start_time_slot_id ||
                            !rawMeetInfo.end_time_slot_id
                          }
                        >
                          {t("done")}
                        </RectButton>
                      </>
                    ) : (
                      <>
                        <RectButton
                          buttonTheme="#FBAE98"
                          variant="hollow"
                          onClick={() => {
                            if (!login) {
                              navigate("/");
                            }
                            setLeaveOpen(true);
                          }}
                        >
                          {host ? t("deleteMeet") : t("leaveMeet")}
                        </RectButton>
                        {!confirmed && (
                          <RectButton
                            buttonTheme="#DB8600"
                            variant="solid"
                            onClick={handleVote}
                          >
                            {t("vote")}
                          </RectButton>
                        )}
                      </>
                    )}
                  </div>
                </ContentContainer.InfoContainer>
                <ContentContainer.GroupAvailability>
                  {t("groupAva")}
                </ContentContainer.GroupAvailability>
                {DATERANGE.length && TIMESLOTIDS.length && (
                  <ScrollSync>
                    <VotingArea>
                      <VoteOverflowXY
                        DATERANGE={DATERANGE}
                        TIMESLOTIDS={TIMESLOTIDS}
                        Cells={DATERANGE.map((date, d_index) =>
                          TIMESLOTIDS.map((t, t_index) =>
                            editMode && confirmed ? (
                              <ConfirmCell
                                drag={drag}
                                index={[d_index, t_index]}
                                key={t_index}
                                style={{
                                  backgroundColor: cell[d_index][t_index]
                                    ? "#F25C54"
                                    : CELLCOLOR[
                                        d_index * (TIMESLOTIDS.length - 1) +
                                          t_index
                                      ],
                                }}
                                info={
                                  <InfoTooltip
                                    available_members={
                                      groupAvailabilityInfo?.[
                                        d_index * (TIMESLOTIDS.length - 1) +
                                          t_index
                                      ]?.available_members
                                    }
                                    unavailable_members={
                                      groupAvailabilityInfo?.[
                                        d_index * (TIMESLOTIDS.length - 1) +
                                          t_index
                                      ]?.unavailable_members
                                    }
                                  />
                                }
                              />
                            ) : (
                              <InfoCell
                                ref={
                                  date === confirmedTime.date &&
                                  confirmedTime.timeID.includes(t - 1)
                                    ? confirmTimeRef
                                    : null
                                }
                                style={{
                                  backgroundColor:
                                    date === confirmedTime.date &&
                                    confirmedTime.timeID.includes(t)
                                      ? "#F25C54"
                                      : confirmed
                                      ? "#F0F0F0"
                                      : CELLCOLOR[
                                          d_index * (TIMESLOTIDS.length - 1) +
                                            t_index
                                        ],
                                }}
                                info={
                                  <InfoTooltip
                                    available_members={
                                      groupAvailabilityInfo?.[
                                        d_index * (TIMESLOTIDS.length - 1) +
                                          t_index
                                      ]?.available_members
                                    }
                                    unavailable_members={
                                      groupAvailabilityInfo?.[
                                        d_index * (TIMESLOTIDS.length - 1) +
                                          t_index
                                      ]?.unavailable_members
                                    }
                                  />
                                }
                              />
                            )
                          )
                        )}
                      />
                    </VotingArea>
                  </ScrollSync>
                )}
              </Base.FullContainer.ContentContainer>
            )}
            <LeaveModal
              open={leaveOpen}
              setOpen={setLeaveOpen}
              onOk={handleLeaveYes}
              host={host}
            />
            <GuestNameModal
              form={form}
              open={guestNameOpen}
              setOpen={setGuestNameOpen}
              onOk={handleGuestVote}
              handleFormChange={handleFormChange}
            />
            <ConfirmModal
              open={open}
              setOpen={setOpen}
              meetName={rawMeetInfo.meet_name}
              time={time}
              onCancel={handleCancel}
              onOk={handleConfirm}
            />
          </Base.FullContainer>
        </Base>
      </motion.div>
    ))
  );
};

export default MeetInfo;
