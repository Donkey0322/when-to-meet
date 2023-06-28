/*TODO:********************************************************************************************
  1. RWD, 頁面縮過小時的錯誤
**************************************************************************************************/
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Divider, Typography, Form } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useMeet } from "../hooks/useMeet";
import Base from "../../components/Base/orange3_white7";
import Button from "../../components/Button";
import Link from "../../components/Link";
import Notification from "../../components/Notification";
import { RWD, ANIME } from "../../constant";

const {
  RightContainer,
  RightContainer: { InfoContainer },
} = Base;
const GoogleButton = Button("google");
const { RWDWidth, RWDHeight, RWDFontSize } = RWD;

const CheckCircle = styled(CheckCircleOutlined)`
  color: #5c9b6b;
  position: absolute;
  left: 105%;
  font-size: ${RWDFontSize(20)};
  ${ANIME.FadeIn};
`;

const CloseCircle = styled(CloseCircleOutlined)`
  color: #ae2a39;
  font-size: ${RWDFontSize(20)};
  position: absolute;
  left: 105%;
  ${ANIME.FadeIn};
`;

const SignUp = () => {
  const {
    setLoading,
    MIDDLEWARE: { signUp },
  } = useMeet();
  const navigate = useNavigate();
  const [notification, setNotification] = useState({});
  const [signupData, setSignupData] = useState({
    Email: "",
    Username: "",
    Password: "",
    "Confirm Password": "",
  });
  const { t } = useTranslation();

  const CONTENTNAME = {
    Email: t("email"),
    Username: t("username"),
    Password: t("password"),
    "Confirm Password": "",
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignUpClick = async () => {
    try {
      setLoading(true);
      const { error } = await signUp({
        username: signupData.Username,
        password: signupData.Password,
        email: signupData.Email,
      });
      setLoading(false);
      if (error) {
        switch (error) {
          case "UsernameExists":
            setNotification({
              title: t("signupFailed"),
              message: t("usernameExists"),
            });
            break;
          case "EmailExist":
            setNotification({
              title: t("signupFailed"),
              message: t("emailExist"),
            });
            break;
          default:
            break;
        }
      } else {
        setNotification({
          title: t("verSent"),
          message: t("checkMail"),
        });
      }
    } catch (e) {
      alert(e);
    }
  };

  return (
    <>
      <Notification
        notification={notification}
        setNotification={setNotification}
      />
      <Base>
        <Base.RightContainer>
          <RightContainer.InfoContainer style={{ height: RWDHeight(688) }}>
            <InfoContainer.InputContainer style={{ marginTop: RWDHeight(50) }}>
              <InfoContainer.Title>{t("welcome")}</InfoContainer.Title>
              {Object.keys(signupData)
                .filter((m) => m !== "Confirm Password")
                .map((m, index) => {
                  const Component = m.includes("Password")
                    ? InfoContainer.Password
                    : InfoContainer.Input;
                  return m.includes("name") ? (
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
                      <Component
                        placeholder={CONTENTNAME[m]}
                        name={m}
                        onChange={handleSignupChange}
                        key={index}
                      />
                    </Form.Item>
                  ) : m === "Password" ? (
                    <Form.Item
                      name={"Password"}
                      rules={[
                        {
                          min: 8,
                          validateTrigger: "onChange",
                          message:
                            "Password should contain at least 8 characters.",
                        },
                      ]}
                      style={{ margin: 0 }}
                    >
                      <Component
                        placeholder={CONTENTNAME[m]}
                        name={m}
                        onChange={handleSignupChange}
                        key={index}
                      />
                    </Form.Item>
                  ) : (
                    <Component
                      placeholder={CONTENTNAME[m]}
                      name={m}
                      onChange={handleSignupChange}
                      key={index}
                    />
                  );
                })}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  columnGap: RWDWidth(10),
                  position: "relative",
                }}
              >
                <InfoContainer.Password
                  style={{ width: RWDWidth(350) }}
                  placeholder={t("confirmPwd")}
                  name={"Confirm Password"}
                  onChange={handleSignupChange}
                  key={"1231"}
                />
                {signupData["Confirm Password"] &&
                  (signupData.Password === signupData["Confirm Password"] ? (
                    <CheckCircle />
                  ) : (
                    <CloseCircle />
                  ))}
              </div>
            </InfoContainer.InputContainer>
            <InfoContainer.InputContainer
              style={{
                alignItems: "center",
                gap: "unset",
                height: RWDHeight(243),
                justifyContent: "space-evenly",
                position: "relative",
              }}
            >
              <InfoContainer.Button
                disabled={
                  !signupData.Username ||
                  !signupData.Password >= 8 ||
                  !signupData.Email ||
                  !signupData["Confirm Password"] ||
                  signupData.Password !== signupData["Confirm Password"] ||
                  !/^[^#$%&*/?@]*$/.test(signupData.Username) ||
                  !/^(?!guest_).*/.test(signupData.Username)
                }
                onClick={handleSignUpClick}
              >
                {t("signup")}
              </InfoContainer.Button>
              <Divider
                style={{ borderColor: "#808080", color: "#808080", margin: 0 }}
              >
                or
              </Divider>
              <GoogleButton>{t("signupGoogle")}</GoogleButton>
            </InfoContainer.InputContainer>
            <InfoContainer.InputContainer
              style={{
                gap: "unset",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography.Text type="secondary">
                {t("already") + " "}
                <Link
                  onClick={() => {
                    navigate("/login");
                  }}
                  style={{
                    fontSize: RWDFontSize(16),
                  }}
                  linkTheme="#DB8600"
                >
                  {t("login")}
                </Link>
              </Typography.Text>
            </InfoContainer.InputContainer>
          </RightContainer.InfoContainer>
        </Base.RightContainer>
      </Base>
    </>
  );
};

export default SignUp;
