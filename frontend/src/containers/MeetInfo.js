import { InfoCircleFilled, EditFilled } from "@ant-design/icons";
import { Modal, Form } from "antd";
import { motion } from "framer-motion";
import _ from "lodash";
import Moment from "moment";
import { extendMoment } from "moment-range";
import React, { Fragment, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ScrollSync, ScrollSyncPane } from "react-scroll-sync";
import { useMeet } from "./hooks/useMeet";
import Base from "../components/Base/145MeetRelated";
import Button from "../components/Button";
import Input from "../components/Input";
import MeetInfoEdit from "../components/MeetInfo";
import Tag from "../components/Tag";
import TimeCell, { slotIDProcessing } from "../components/TimeCell";
import { RWD, COLORS } from "../constant";
import { meet, getGroupAvailability } from "../middleware";
import { useTranslation } from "react-i18next";
const { RWDHeight, RWDWidth, RWDFontSize } = RWD;
const MemberTag = Tag("member");
const InfoCell = TimeCell("info");
const moment = extendMoment(Moment);
const MainInput = Input("main");
const MainPassword = Input.Password("main");
const BackButton = Button("back");
const ModalButton = Button("modal");
const RectButton = Button("rect");
const getMeetInfo = meet("read");
const joinMeet = meet("join");
const leaveMeet = meet("leave");

const { ContentContainer } = Base.FullContainer;

const {
  GroupAvailability,
  GroupAvailability: { VotingContainer },
  GroupAvailability: {
    VotingContainer: { DayContainer },
  },
  GroupAvailability: {
    VotingContainer: {
      DayContainer: { CellHoverContainer },
    },
  },
} = ContentContainer;

const MeetInfo = () => {
  const { t } = useTranslation();
  const [isModalLeaveOpen, setIsModalLeaveOpen] = useState(false);
  const [isModalVoteOpen, setIsModalVoteOpen] = useState(false);
  const ref = useRef(); //偵測星期三的高度與寬度
  const [DATERANGE, setDATERANGE] = useState([]);
  const [TIMESLOTIDS, setTIMESLOTIDS] = useState([]);
  const [groupAvailabilityInfo, setGroupAvailabilityInfo] = useState([]);
  const [CELLCOLOR, setCELLCOLOR] = useState([]);

  const [meetInfo, setMeetInfo] = useState({
    "Meet Name": "",
    "Start / End Date": "",
    "Start / End Time": "",
    Host: "",
    Member: "",
    Description: "",
    "Voting Deadline": "",
    "Invitation URL": "",
    "Google Meet URL": "",
  });
  const [rawMeetInfo, setRawMeetInfo] = useState({});
  const [forMemberDataFormat, setForMemberDataFormat] = useState([]);
  const [editMode, setEditMode] = useState(false);

  const { login, cookies, setError, setLoading } = useMeet();
  const navigate = useNavigate();
  const location = useLocation();
  const { code } = useParams();
  const [form] = Form.useForm();

  const handleMeetInfo = async () => {
    try {
      setLoading(true);
      const { data: votingData } = await getGroupAvailability(
        code,
        cookies.token
      );
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
        },
      } = await getMeetInfo(code, cookies.token);
      setForMemberDataFormat(
        member_infos.map((m) => ({ username: m.name, id: m.member_id }))
      );
      setMeetInfo({
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
            {host_info?.name ??
              host_info?.member_id ??
              location.state.guestName}
          </MemberTag>
        ),
        Member: (
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
        ),
        Description: description ?? "None",
        "Voting Deadline": voting_end_time
          ? moment(voting_end_time).format("YYYY/MM/DD HH:mm:ss")
          : "None",
        "Invitation URL": `https://lets.meet.com?invite=${invite_code}`,
        "Google Meet URL": meet_url ?? "None",
      });
      setRawMeetInfo({
        meet_name,
        start_date,
        end_date,
        start_time_slot_id,
        end_time_slot_id,
        description,
        voting_end_time,
        gen_meet_url: meet_url ? true : false,
        member_ids: member_infos.map((m) => m.member_id),
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

  const CONTENTNAME = {
    "Meet Name": t("meetName"),
    "Start / End Date": t("startDate"),
    "Start / End Time": t("startTime"),
    Host: t("host"),
    Member: t("member"),
    Description: t("description"),
    "Voting Deadline": t("votingDeadline"),
    "Invitation URL": t("invitation"),
    "Google Meet URL": t("url"),
  };

  useEffect(() => {
    if (code) {
      handleMeetInfo();
    }
  }, [code]);

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

  const handleLeaveYes = async () => {
    try {
      setLoading(true);
      const { error } = await leaveMeet(code, cookies.token);
      if (!error) {
        setLoading(false);
        navigate("/meets");
      }
    } catch (error) {
      throw error;
    }
  };

  const handleVote = () => {
    if (!login && !location?.state?.guestName) {
      setIsModalVoteOpen(true);
      return;
    }
    navigate(`/voting/${code}`);
  };

  const handleVoteOk = async (e) => {
    // console.log(form);
    await joinMeet(
      { invite_code: code, name: form.getFieldValue().name },
      cookies.token
    );
    navigate(`/voting/${code}`);
    setIsModalVoteOpen(false);
  };

  const handleMeetDataChange =
    (func, ...name) =>
    (e) => {
      if (name.length === 1) {
        setRawMeetInfo((prev) => ({ ...prev, [name[0]]: func(e) }));
      } else {
        setRawMeetInfo((prev) => ({
          ...prev,
          [name[0]]: func(e[0], 1),
          [name[1]]: func(e[1], 0),
        }));
      }
    };

  return (
    <motion.div
      initial={{ x: 1000 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Base login={login}>
        <Base.FullContainer>
          {meetInfo?.["Meet Name"] && (
            <Base.FullContainer.ContentContainer>
              <ContentContainer.Title style={{ columnGap: RWDWidth(10) }}>
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
                        if (cookies.token) {
                          navigate("/meets");
                        } else {
                          navigate("/");
                        }
                      }}
                    />
                    {meetInfo["Meet Name"]}
                    <EditFilled
                      onClick={() => {
                        setEditMode((prev) => !prev);
                      }}
                    />
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
                  meetInfo={meetInfo}
                  rawMeetInfo={rawMeetInfo}
                  reviseMode={editMode}
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
                  <RectButton
                    buttonTheme="#FBAE98"
                    variant="hollow"
                    onClick={() => {
                      if (!login) {
                        navigate("/");
                      }
                      setIsModalLeaveOpen(true);
                    }}
                  >
                    Leave Meet
                  </RectButton>
                  <RectButton
                    buttonTheme="#DB8600"
                    variant="solid"
                    type="primary"
                    onClick={handleVote}
                  >
                    Vote
                  </RectButton>
                </div>
              </ContentContainer.InfoContainer>
              <ContentContainer.GroupAvailability>
                {t("groupAva")}
              </ContentContainer.GroupAvailability>
              {DATERANGE.length && TIMESLOTIDS.length && (
                <ScrollSync>
                  <GroupAvailability.VotingContainer>
                    <ScrollSyncPane>
                      <VotingContainer.DayContainer>
                        <DayContainer.TimeContainer
                          style={{ paddingTop: RWDHeight(30) }}
                        >
                          {slotIDProcessing(TIMESLOTIDS[0])}
                        </DayContainer.TimeContainer>
                        {DATERANGE.map((w, index) => (
                          <DayContainer.CellContainer
                            key={index}
                            // ref={w === "WED" ? ref : null}
                          >
                            <div style={{ userSelect: "none" }}>
                              {moment(w).format("MMM DD")}
                            </div>
                            <div
                              style={{ userSelect: "none", fontWeight: "bold" }}
                            >
                              {moment(w).format("ddd")}
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
                          {DATERANGE.map((_, w_index) => (
                            <DayContainer.CellContainer key={w_index}>
                              <InfoCell
                                style={{
                                  backgroundColor:
                                    CELLCOLOR[
                                      w_index * (TIMESLOTIDS.length - 1) +
                                        t_index
                                    ],
                                }}
                                info={
                                  <DayContainer.CellHoverContainer>
                                    <CellHoverContainer.CellHoverInfo>
                                      <div
                                        style={{
                                          fontWeight: "bold",
                                          textDecoration: "underline",
                                        }}
                                      >
                                        Availble
                                      </div>
                                      {groupAvailabilityInfo?.[
                                        w_index * (TIMESLOTIDS.length - 1) +
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
                                      {groupAvailabilityInfo?.[
                                        w_index * (TIMESLOTIDS.length - 1) +
                                          t_index
                                      ]?.unavailable_members.map((m, index) => (
                                        <div key={index}>{m}</div>
                                      ))}
                                    </CellHoverContainer.CellHoverInfo>
                                  </DayContainer.CellHoverContainer>
                                }
                              />
                            </DayContainer.CellContainer>
                          ))}
                        </VotingContainer.DayContainer>
                      </ScrollSyncPane>
                    ))}
                  </GroupAvailability.VotingContainer>
                </ScrollSync>
              )}
            </Base.FullContainer.ContentContainer>
          )}
          <Modal
            bodyStyle={{ height: RWDHeight(30) }}
            centered
            closable={false}
            footer={
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <ModalButton
                  buttonTheme="#B8D8BA"
                  variant="solid"
                  onClick={() => {
                    setIsModalLeaveOpen(false);
                  }}
                >
                  NO
                </ModalButton>
                <ModalButton
                  buttonTheme="#B8D8BA"
                  variant="hollow"
                  onClick={handleLeaveYes}
                >
                  YES
                </ModalButton>
              </div>
            }
            onCancel={() => {
              setIsModalLeaveOpen(false);
            }}
            open={isModalLeaveOpen}
            title={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  columnGap: RWDWidth(12),
                }}
              >
                <InfoCircleFilled style={{ color: "#FAAD14" }} />
                <span>Are you sure you want to leave this meet?</span>
              </div>
            }
          />
          <Modal
            centered
            closable={false}
            footer={null}
            onCancel={() => {
              setIsModalVoteOpen(false);
            }}
            open={isModalVoteOpen}
            title=""
            width={RWDWidth(450)}
          >
            <Form
              form={form}
              style={{
                width: RWDWidth(393),
                height: RWDHeight(192),
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                margin: "15px 0",
              }}
            >
              <Form.Item
                name="username"
                rules={[
                  {
                    required: true,
                    message: "Username is required",
                  },
                ]}
                style={{ margin: 0 }}
              >
                <MainInput placeholder="Your name" />
              </Form.Item>
              <Form.Item name="password" style={{ margin: 0 }}>
                <MainPassword placeholder="Password (optional)" />
              </Form.Item>
              <Form.Item style={{ margin: 0, alignSelf: "flex-end" }}>
                <ModalButton
                  htmlType="submit"
                  buttonTheme="#B8D8BA"
                  variant="solid"
                >
                  OK
                </ModalButton>
              </Form.Item>
            </Form>
          </Modal>
        </Base.FullContainer>
      </Base>
    </motion.div>
  );
};

export default MeetInfo;
