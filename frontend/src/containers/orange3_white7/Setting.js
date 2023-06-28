import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { Form, Popconfirm } from "antd";
import _ from "lodash";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useMeet } from "../hooks/useMeet";
import Base from "../../components/Base/orange3_white7";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Notification from "../../components/Notification";
import Radio from "../../components/Radio";
import { RWD, ANIME } from "../../constant";
const GoogleButton = Button("google");
const LineButton = Button("line");
const RectButton = Button("rect");
const ThinnerInput = Input("thinner");
const ThinnerPassword = Input.Password("thinner");
const { RWDHeight, RWDFontSize, RWDWidth } = RWD;

const CheckCircle = styled(CheckCircleOutlined)`
  color: #5c9b6b;
  font-size: ${RWDFontSize(20)};
  ${ANIME.FadeIn};
`;

const CloseCircle = styled(CloseCircleOutlined)`
  color: #ae2a39;
  font-size: ${RWDFontSize(20)};
  ${ANIME.FadeIn};
`;

const SLIDE = styled.div`
  ${ANIME.SlideFromTop}
`;

const ChangeColor = styled.div`
  ${ANIME.ChangeColor("#000000", "#DB8600")};
`;

const InstructionContainer = Object.assign(
  styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    row-gap: ${RWDHeight(10)};
  `,
  {
    Item: styled.div`
      font-size: ${RWDFontSize(20)};
      color: #db8600;
      font-weight: 700;
    `,
  }
);

const InfoContainer = Object.assign(
  styled.div`
    display: flex;
    flex-direction: column;
    width: ${RWDWidth(880)};
    /* margin-top: ${RWDHeight(10)}; */
  `,
  {
    Title: styled.div`
      font-size: ${RWDFontSize(24)};
      font-weight: 700;
      border-bottom: 1px solid #808080;
      margin-top: ${RWDHeight(35)};
    `,
    AccountSetting: Object.assign(
      styled.div`
        display: grid;
        grid-template-columns: repeat(2, max-content);
        grid-template-rows: repeat(3, max-content);
        grid-column-gap: ${RWDWidth(70)};
        grid-row-gap: ${RWDHeight(30)};
        margin-top: ${RWDHeight(10)};
      `,
      {
        Content: styled.div`
          font-size: ${RWDFontSize(20)};
          font-weight: bold;
          display: flex;
          align-items: center;
        `,
      }
    ),
    ButtonContainer: styled.div`
      align-self: flex-end;
      display: flex;
      align-items: center;
      column-gap: ${RWDWidth(10)};
      margin-top: ${RWDHeight(10)};
    `,
  }
);

export default function Setting() {
  const { search, state } = useLocation();
  const {
    login,
    setLoading,
    USERINFO,
    USERINFO: { ID, username, email, line_token, notification_preference },
    setUSERINFO,
    MIDDLEWARE: {
      getUserInfo,
      editAccount,
      editPreference,
      lineConnect,
      lineToken,
      lineJoin,
    },
  } = useMeet();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userData, setUserData] = useState({ username, email });
  const [oriUserData, setOriUserData] = useState({ username, email });
  const [changePassword, setChangePassword] = useState(false);
  const [preference, setPreference] = useState(notification_preference);
  const [notification, setNotification] = useState({});
  const [changeEmailReminder, setChangeEmailReminder] = useState("");
  const [lineCodeReminder, setLineCodeReminder] = useState(false);

  /*調整 Setting 文字 套組*/
  const RoutineRef = useRef(null);
  const [top, setTop] = useState(0);
  const throttledHandleResize = _.throttle(() => {
    if (RoutineRef?.current) {
      setTop(RoutineRef?.current.offsetTop);
    }
  }, 100);

  useEffect(() => {
    if (RoutineRef?.current) {
      setTop(RoutineRef?.current.offsetTop);
    } //load 時
    window.addEventListener("resize", throttledHandleResize);
    return () => {
      window.removeEventListener("resize", throttledHandleResize);
    };
  }, []);
  /******************************************************/

  useEffect(() => {
    if (state?.line && USERINFO.ID) {
      (async () => {
        const { data } = await getUserInfo(undefined, USERINFO.ID);
        setUSERINFO((prev) => ({ ...prev, ...data }));
      })();
      lineJoin();
      setLineCodeReminder(true);
    }
  }, [state?.line, USERINFO.ID]);

  useEffect(() => {
    (async () => {
      if (search) {
        const code = new URLSearchParams(search).get("code");
        const state = new URLSearchParams(search).get("state");
        if (code && state) {
          await lineToken({ code, state });
          navigate("/settings", {
            state: {
              line: "initial",
            },
          });
        }
      }
      if (!login) {
        navigate("/");
      }
    })();
  }, [login]);

  const handleUserDataChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccountUpdate = async () => {
    setLoading(true);
    const { error } = await editAccount(userData);
    setLoading(false);
    if (error) {
      setUserData(JSON.parse(JSON.stringify(oriUserData)));
    } else {
      const { data } = await getUserInfo(undefined, ID);
      setNotification({
        title: "Update successfully",
        message: "",
      });
      setUSERINFO((prev) => ({ ...prev, ...data }));
      if (userData.email !== oriUserData.email)
        setChangeEmailReminder(userData.email);
    }
    setChangePassword(false);
    switch (error) {
      case "EmailExist":
        setNotification({
          title: t("updateFailed"),
          message: t("emailExist"),
        });
        break;
      case "UsernameExists":
        setNotification({
          title: t("updateFailed"),
          message: t("usernameExists"),
        });
        break;
      case "NoPermission":
        setNotification({
          title: t("changePwdFailed"),
          message: t("wrongPwd"),
        });
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (USERINFO) {
      const { username, email, notification_preference } = USERINFO;
      setUserData({ username, email });
      setOriUserData({ username, email });
      setPreference(notification_preference);
    }
  }, [USERINFO]);

  const handleEditPrefernce = async (e) => {
    const { value } = e.target;
    await editPreference({ preference: value });
    setPreference(value);
    setUSERINFO((prev) => ({ ...prev, notification_preference: value }));
  };

  const BILINGUAL = {
    Username: t("username"),
    Email: t("email"),
    Password: t("password"),
  };

  const CONTENTMENU = {
    Username: (
      <Form
        fields={[
          {
            name: ["username"],
            value: userData.username,
          },
        ]}
      >
        <Form.Item
          name="username"
          rules={[
            {
              pattern: /^[^#$%&*/?@]*$/,
              validateTrigger: "onChange",
              message: "Please avoid `#$%&*/?@",
            },
            {
              pattern: /^(?!guest_).*/,
              validateTrigger: "onChange",
              message: "Please avoid using guest_ as prefix.",
            },
          ]}
          style={{ margin: 0 }}
        >
          <ThinnerInput onChange={handleUserDataChange} name="username" />
        </Form.Item>
      </Form>
    ),
    Email: (
      <Popconfirm
        title="Verification mail sent"
        description={
          <div style={{ width: RWDWidth(350) }}>
            Please check your mailbox.
            <div style={{ fontWeight: 700, margin: "2px 0" }}>
              {changeEmailReminder}
            </div>
            Email will be updated in the Settings page after you verify your new
            email.
          </div>
        }
        cancelButtonProps={{ style: { display: "none" } }}
        okButtonProps={{ style: { display: "none" } }}
        placement="bottomLeft"
        open={Boolean(changeEmailReminder)}
        onPopupClick={(e) => {
          e.stopPropagation();
        }}
      >
        <ThinnerInput
          onChange={handleUserDataChange}
          name="email"
          value={userData.email}
          disabled={login === "google"}
        />
      </Popconfirm>
    ),
    Password: (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          rowGap: RWDHeight(25),
        }}
      >
        <RectButton
          variant="hollow"
          buttonTheme="#DB8600"
          onClick={() => {
            setChangePassword((prev) => !prev);
          }}
          disabled={login === "google"}
        >
          {t("changePwd")}
          {changePassword ? <UpOutlined /> : <DownOutlined />}
        </RectButton>
        <div
          style={{
            display: "relative",
            overflow: "hidden",
            visibility: changePassword ? "visible" : "hidden",
          }}
        >
          {changePassword && (
            <SLIDE
              style={{
                display: "flex",
                flexDirection: "column",
                rowGap: RWDHeight(25),
                position: "relative",
              }}
            >
              <ThinnerPassword
                onChange={handleUserDataChange}
                name="old_password"
                placeholder={t("oldPwd")}
              />
              <Form>
                <Form.Item
                  name={"new_password"}
                  rules={[
                    {
                      min: 8,
                      validateTrigger: "onChange",
                      message: "Password should contain at least 8 characters.",
                    },
                  ]}
                  style={{ margin: 0 }}
                >
                  <ThinnerPassword
                    onChange={handleUserDataChange}
                    name="new_password"
                    placeholder={t("newPwd")}
                  />
                </Form.Item>
              </Form>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  columnGap: RWDWidth(10),
                }}
              >
                <ThinnerPassword
                  onChange={handleUserDataChange}
                  name="Confirm New Password"
                  placeholder={t("confirmNewPwd")}
                />
                {userData["Confirm New Password"] &&
                  (userData.new_password ===
                  userData["Confirm New Password"] ? (
                    <CheckCircle />
                  ) : (
                    <CloseCircle />
                  ))}
              </div>
            </SLIDE>
          )}
          <SLIDE
            style={{
              display: changePassword ? "none" : "flex",
              visibility: "hidden",
              flexDirection: "column",
              rowGap: RWDHeight(25),
              position: "relative",
            }}
          >
            <ThinnerPassword
              onChange={handleUserDataChange}
              name="old_password"
              placeholder={t("oldPwd")}
            />
            <ThinnerPassword
              onChange={handleUserDataChange}
              name="new_password"
              placeholder={t("newPwd")}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                columnGap: RWDWidth(10),
              }}
            >
              <ThinnerPassword
                onChange={handleUserDataChange}
                name="Confirm New Password"
                placeholder={t("confirmNewPwd")}
              />
              {userData["Confirm New Password"] &&
                (userData.new_password === userData["Confirm New Password"] ? (
                  <CheckCircle />
                ) : (
                  <CloseCircle />
                ))}
            </div>
          </SLIDE>
        </div>
      </div>
    ),
  };

  return (
    <>
      <Notification
        notification={notification}
        setNotification={setNotification}
      />
      <Base
        login={true}
        title_disable={true}
        onClick={() => {
          setChangeEmailReminder("");
          setLineCodeReminder(false);
        }}
      >
        <Base.LeftContainer
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingRight: RWDWidth(18),
          }}
        >
          <p
            style={{
              fontSize: RWDFontSize(32),
              color: "#B76A00",
              margin: 0,
              fontWeight: 800,
              letterSpacing: "1px",
            }}
            ref={RoutineRef}
          >
            {t("settings")}
          </p>
          <InstructionContainer
            style={{ position: "absolute", top, marginTop: RWDHeight(80) }}
          >
            <InstructionContainer.Item>
              {t("setInfo")}
            </InstructionContainer.Item>
            <InstructionContainer.Item>
              {t("connect3")}
            </InstructionContainer.Item>
            <InstructionContainer.Item>
              {t("changePreferences")}
            </InstructionContainer.Item>
          </InstructionContainer>
        </Base.LeftContainer>
        <Base.RightContainer
          style={{
            gridRow: "2/3",
            marginLeft: RWDWidth(30),
          }}
        >
          <InfoContainer>
            <InfoContainer.Title>{t("accountSet")}</InfoContainer.Title>
            <InfoContainer.AccountSetting>
              {userData.username !== undefined &&
                Object.keys(CONTENTMENU).map((title, index) => (
                  <Fragment key={index}>
                    <InfoContainer.AccountSetting.Content
                      style={{
                        gridColumn: "1/2",
                        gridRow: `${index + 1}/${index + 2}`,
                        alignSelf: title === "Password" && "flex-start",
                      }}
                    >
                      {BILINGUAL[title]}
                    </InfoContainer.AccountSetting.Content>
                    <InfoContainer.AccountSetting.Content
                      style={{
                        gridColumn: "2/3",
                        gridRow: `${index + 1}/${index + 2}`,
                        fontWeight: "normal",
                      }}
                    >
                      {CONTENTMENU[title]}
                    </InfoContainer.AccountSetting.Content>
                  </Fragment>
                ))}
            </InfoContainer.AccountSetting>
            <InfoContainer.ButtonContainer>
              <RectButton
                variant="solid"
                buttonTheme="#5A8EA4"
                disabled={
                  _.isEqual(oriUserData, userData) ||
                  !userData.username ||
                  !userData.email ||
                  !/^[^#$%&*/?@]*$/.test(userData.username) ||
                  !/^(?!guest_).*/.test(userData.username) ||
                  (changePassword &&
                    (!userData.old_password ||
                      !userData.new_password ||
                      !userData["Confirm New Password"] ||
                      userData.new_password !==
                        userData["Confirm New Password"]))
                }
                onClick={handleAccountUpdate}
              >
                {t("update")}
              </RectButton>
              <RectButton
                variant="hollow"
                buttonTheme="#D8D8D8"
                onClick={() => {
                  setUserData(JSON.parse(JSON.stringify(oriUserData)));
                  setChangePassword(false);
                }}
              >
                {t("reset")}
              </RectButton>
            </InfoContainer.ButtonContainer>

            <InfoContainer.Title>{t("thirdParty")}</InfoContainer.Title>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                columnGap: RWDWidth(25),
                marginTop: RWDHeight(20),
              }}
            >
              <GoogleButton
                style={{ minWidth: "fit-content", width: RWDWidth(350) }}
                disabled={login === "google"}
              >
                {t("connectGoogle")}
              </GoogleButton>
              <LineButton
                style={{ minWidth: "fit-content", width: RWDWidth(350) }}
                onClick={() => {
                  lineConnect();
                }}
                disabled={line_token}
              >
                {t("connectLine")}
              </LineButton>
            </div>
            <InfoContainer.Title>
              {t("notificationPreferences")}
            </InfoContainer.Title>
            <div
              style={{
                marginTop: RWDHeight(20),
                display: "flex",
                flexDirection: "column",
                rowGap: RWDHeight(15),
              }}
            >
              <div>{t("connectLineEmail")}</div>
              <Radio
                radioTheme="#DB8600"
                value={preference}
                elements={[
                  { value: "EMAIL", label: t("email") },
                  {
                    value: "LINE",
                    label: (
                      <Popconfirm
                        title={t("connectLine")}
                        description={
                          <>
                            <div style={{ width: RWDWidth(350) }}>
                              {t("scanQRcode")}
                            </div>
                            <ChangeColor
                              style={{
                                marginTop: "10px",
                                textDecoration: "underline",
                                color: "#000000",
                                fontWeight: "bold",
                                cursor: "pointer",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                lineJoin();
                              }}
                            >
                              https://line.me/R/ti/p/@766ivmyp
                            </ChangeColor>
                          </>
                        }
                        cancelButtonProps={{ style: { display: "none" } }}
                        okButtonProps={{ style: { display: "none" } }}
                        placement="bottomLeft"
                        open={lineCodeReminder}
                        onPopupClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {t("lineMessage")}
                      </Popconfirm>
                    ),
                    props: { disabled: !line_token },
                  },
                ]}
                onChange={handleEditPrefernce}
              />
            </div>
          </InfoContainer>
        </Base.RightContainer>
      </Base>
    </>
  );
}
