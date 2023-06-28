/*TODO:********************************************************************************************
  1.RWD, 在頁面高度縮小時 create meet 的欄位要產生 scroll, 在小到無法容下 create button 時要浮動 button
**************************************************************************************************/
import { ArrowRightOutlined } from "@ant-design/icons";
import _ from "lodash";
import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useMeet } from "../hooks/useMeet";
import Base from "../../components/Base/orange3_white7";
import Button from "../../components/Button";
import Input from "../../components/Input";
import MeetInfo from "../../components/MeetInfo";
import Modal from "../../components/Modal";
import Notification from "../../components/Notification";
import Title from "../../components/Title";
import { RWD } from "../../constant";
const PrimaryButton = Button();
const RectButton = Button("rect");
const ShortInput = Input("shorter");
const GuestNameModal = Modal("guestName");
const { RWDHeight, RWDFontSize, RWDWidth, RWDRadius } = RWD;

const JoinMeet = Object.assign(
  styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    row-gap: ${RWDHeight(20)};
    top: ${RWDHeight(180)};
  `,
  {
    Title: styled.p`
      font-size: ${RWDFontSize(30)}; //max(1.6vw, 20px);
      font-weight: bold;
      margin: 0;
    `,
    InvitationArea: Object.assign(
      styled.div`
        display: flex;
        align-items: center;
        column-gap: ${RWDWidth(10)};
      `,
      {
        Input: styled(ShortInput)`
          border-radius: ${RWDRadius(10)};
          font-size: ${RWDFontSize(16)};
        `,
      }
    ),
  }
);

export default function Mainpage() {
  const {
    login,
    setError,
    setLoading,
    MIDDLEWARE: { addMeet, joinMeet, getMeetInfo },
  } = useMeet();
  const navigate = useNavigate();
  const [guestCreateModalOpen, setGuestCreateModalOpen] = useState(false);
  const [meetData, setMeetData] = useState({
    meet_name: "", //<String>
    start_date: "", //<String>
    end_date: "", //<String>
    start_time_slot_id: 0, //<Number (0, 48]>
    end_time_slot_id: 0, //<Number (0, 48]>
    gen_meet_url: false, //<Boolean>
    voting_end_time: undefined, //<string ISOString>
    description: "", //<String>
    member_ids: [], //[Number]
    emails: [], //[String]
  });
  const invite = useRef(null);
  const [notification, setNotification] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    setMeetData({
      meet_name: "",
      start_date: "",
      end_date: "",
      start_time_slot_id: 0,
      end_time_slot_id: 0,
      gen_meet_url: false,
      voting_end_time: undefined,
      description: "",
      member_ids: [],
      emails: [],
    });
  }, [login]);

  /*調整 invitation area 套組*/
  const ref = useRef(null); //追蹤LetMEET
  const [width, setWidth] = useState(ref?.current?.offsetWidth);

  const throttledHandleResize = _.throttle(() => {
    setWidth(ref?.current?.offsetWidth);
  }, 500);

  useEffect(() => {
    window.addEventListener("resize", throttledHandleResize);
    return () => {
      window.removeEventListener("resize", throttledHandleResize);
    };
  }, []);
  /******************************************************/

  /*調整 guest name 套組*/
  const [form, setForm] = useState({ username: "", password: "" });
  const handleFormChange = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
  };
  /******************************************************/

  const handleInvite = async (e) => {
    if (!invite?.current?.input?.value) {
      return;
    }
    if (e?.key === "Enter" || !e.key) {
      if (login) {
        const { error } = await joinMeet(invite.current.input.value);
        if (error && error === "NotFound") {
          setNotification({
            title: "Invitation code error",
            message: "The invitation code is invalid.",
          });
          return;
        }
        if (error && error !== "UniqueViolationError") {
          setError(error);
          return;
        }
      } else {
        const { error } = await getMeetInfo(invite.current.input.value);
        if (error && error === "NotFound") {
          setNotification({
            title: "Invitation code error",
            message: "The invitation code is invalid.",
          });
          return;
        }
        if (error && error !== "UniqueViolationError") {
          setError(error);
          return;
        }
      }
      navigate(`/meets/${invite.current.input.value}`);
    }
  };

  const handleMeetDataChange =
    (func, ...name) =>
    (e) => {
      if (name.length === 1) {
        setMeetData((prev) => ({ ...prev, [name[0]]: func(e) }));
      } else {
        setMeetData((prev) => ({
          ...prev,
          [name[0]]: e ? func(e[0], 1) : undefined,
          [name[1]]: e ? func(e[1], 0) : undefined,
        }));
      }
    };

  const handleMeetCreate = async () => {
    try {
      if (!login) {
        setGuestCreateModalOpen(true);
        return;
      }
      setLoading(true);
      const { data } = await addMeet(meetData);
      navigate(`/meets/${data.invite_code}`);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleOk = async () => {
    try {
      const { username: guest_name, password: guest_password } = form;
      if (!guest_name) return;
      setLoading(true);
      const { data } = await addMeet({
        ...meetData,
        guest_name,
        guest_password: guest_password ? guest_password : null,
      });
      navigate(`/meets/${data.invite_code}`);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <>
      <Notification
        notification={notification}
        setNotification={setNotification}
      />
      <Base title_disable={true} login={login}>
        <Base.LeftContainer
          style={{
            display: "flex",
            flexDirection: "column",
            paddingLeft: RWDWidth(101),
            justifyContent: "space-between",
          }}
        >
          <JoinMeet>
            <JoinMeet.Title>{t("joinMeet")}</JoinMeet.Title>
            <JoinMeet.InvitationArea style={{ maxWidth: width }}>
              <JoinMeet.InvitationArea.Input
                placeholder={t("invitation")}
                ref={invite}
                onKeyDown={handleInvite}
              />
              <RectButton
                buttonTheme="#FFA601"
                variant="solid"
                icon={<ArrowRightOutlined />}
                onClick={handleInvite}
                style={{
                  width: RWDFontSize(50),
                  height: RWDFontSize(45),
                  fontSize: RWDFontSize(16),
                }}
              />
            </JoinMeet.InvitationArea>
          </JoinMeet>
          <Title ref={ref} style={{ position: "relative", bottom: "20%" }}>
            Let's meet
          </Title>
        </Base.LeftContainer>
        <Base.RightContainer
          style={{ justifyContent: "flex-start", flexDirection: "column" }}
        >
          <div
            style={{
              position: "relative",
              marginLeft: RWDWidth(120),
              marginTop: RWDHeight(180),
              alignSelf: "flex-start",
              display: "flex",
              flexDirection: "column",
              rowGap: RWDHeight(35),
            }}
          >
            <MeetInfo.Title>{t("createMeet")}</MeetInfo.Title>
            <MeetInfo
              rowGap={30}
              columnGap={55}
              handleMeetDataChange={handleMeetDataChange}
              login={login}
              setMeetData={setMeetData}
              rawMeetInfo={meetData}
            />
            <PrimaryButton
              onClick={handleMeetCreate}
              disabled={
                !meetData.meet_name ||
                !meetData.start_date ||
                !meetData.end_date ||
                !meetData.start_time_slot_id ||
                !meetData.end_time_slot_id
              }
              style={{
                alignSelf: "flex-end",
              }}
            >
              {t("create")}
            </PrimaryButton>
          </div>
        </Base.RightContainer>
        <GuestNameModal
          form={form}
          open={guestCreateModalOpen}
          setOpen={setGuestCreateModalOpen}
          onOk={handleOk}
          handleFormChange={handleFormChange}
        />
      </Base>
    </>
  );
}
