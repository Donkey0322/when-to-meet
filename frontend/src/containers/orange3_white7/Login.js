import { Typography, Divider } from "antd";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useMeet } from "../hooks/useMeet";
import Base from "../../components/Base/orange3_white7";
import Button from "../../components/Button";
import Link from "../../components/Link";
import Notification from "../../components/Notification";
import { RWD } from "../../constant";
const {
  RightContainer,
  RightContainer: { InfoContainer },
} = Base;
const GoogleButton = Button("google");
const { RWDHeight, RWDFontSize } = RWD;

export default function Login() {
  const search = useLocation().search;
  const {
    login,
    GLOBAL_LOGIN,
    setError,
    MIDDLEWARE: { emailVerification, logIn },
  } = useMeet();
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    user_identifier: "",
    password: "",
  });
  const [notification, setNotification] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    if (login) {
      navigate("/");
      return;
    }
    if (search) {
      const code = new URLSearchParams(search).get("code");
      if (code) {
        emailVerification({ code });
      }
    }
  }, [login]);

  const handleLoginClick = async (e) => {
    try {
      if (e?.key === "Enter" || !e.key) {
        if (!loginData.user_identifier || !loginData.password) return;
        const { data, error } = await logIn(loginData);
        if (error) {
          switch (error) {
            case "LoginFailed":
              setNotification({ title: t("loginFailed"), message: "" });
              break;
            case "EmailRegisteredByGoogle":
              setNotification({
                title: t("loginFailed"),
                message: t("linkedGoogle"),
              });
              break;
            default:
              break;
          }
        } else {
          GLOBAL_LOGIN(data.token);
        }
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      <Notification
        notification={notification}
        setNotification={setNotification}
      />
      <Base>
        <Base.RightContainer>
          <RightContainer.InfoContainer
            style={{
              height: RWDHeight(590),
              //TODO: 超出視窗
              // height: 視窗高度小於Login高度 && "90vh",
              // overflowY: 視窗高度小於Login高度 && "scroll",
            }}
          >
            <InfoContainer.InputContainer style={{ marginTop: RWDHeight(50) }}>
              <InfoContainer.Title>{t("welcome")}</InfoContainer.Title>
              <InfoContainer.Input
                placeholder="Username/Email"
                name="user_identifier"
                onChange={handleLoginChange}
                onKeyDown={handleLoginClick}
              />
              <InfoContainer.Password
                placeholder="Password"
                name="password"
                onChange={handleLoginChange}
                onKeyDown={handleLoginClick}
              />
            </InfoContainer.InputContainer>
            <InfoContainer.InputContainer
              style={{
                alignItems: "center",
                gap: "unset",
                height: RWDHeight(243),
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div
                style={{
                  alignSelf: "flex-end",
                }}
              >
                <Link
                  onClick={() => {
                    navigate("/reset");
                  }}
                  style={{
                    fontSize: RWDFontSize(16),
                  }}
                  linkTheme="#DB8600"
                >
                  {t("forgot")}
                </Link>
              </div>
              <InfoContainer.Button
                disabled={!loginData.user_identifier || !loginData.password}
                onClick={handleLoginClick}
              >
                {t("login")}
              </InfoContainer.Button>

              <Divider
                style={{ borderColor: "#808080", color: "#808080", margin: 0 }}
              >
                or
              </Divider>
              <GoogleButton>Login with Google</GoogleButton>
            </InfoContainer.InputContainer>
            <InfoContainer.InputContainer
              style={{
                gap: "unset",
                alignItems: "center",
                justifyContent: "center",
                height: RWDHeight(92),
              }}
            >
              <Typography.Text type="secondary">
                {t("newToMeet") + " "}
                <Link
                  onClick={() => {
                    navigate("/signup");
                  }}
                  style={{
                    fontSize: RWDFontSize(16),
                  }}
                  linkTheme="#DB8600"
                >
                  {t("signup")}
                </Link>
              </Typography.Text>
            </InfoContainer.InputContainer>
          </RightContainer.InfoContainer>
        </Base.RightContainer>
      </Base>
    </>
  );
}
