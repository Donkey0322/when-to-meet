import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMeet } from "../hooks/useMeet";
import { RWD } from "../../constant";
import Base from "../../components/Base/orange3_white7";
import Notification from "../../components/Notification";
const {
  RightContainer,
  RightContainer: { InfoContainer },
} = Base;
const { RWDHeight } = RWD;

export default function ResetPassword() {
  const {
    MIDDLEWARE: { forgetPassword },
  } = useMeet();
  const [email, setEmail] = useState("");
  const [notification, setNotification] = useState({});
  const { t } = useTranslation();

  const handleVerifyClick = async () => {
    try {
      const { error } = await forgetPassword({
        email,
      });
      if (error) {
        switch (error) {
          case "NotFound":
            setNotification({
              title: "Email not registered",
              message: "Please check the email address you entered.",
            });
            break;
          case "EmailRegisteredByGoogle":
            setNotification({
              title: "Email already been linked to Google",
              message: "Please check the email address you entered.",
            });
          default:
            break;
        }
      } else {
        setNotification({ title: t("verSent"), message: t("checkMail") });
      }
    } catch (error) {
      alert(error);
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
          <RightContainer.InfoContainer
            style={{ height: RWDHeight(300), justifyContent: "space-evenly" }}
          >
            <InfoContainer.InputContainer style={{ marginTop: RWDHeight(10) }}>
              <InfoContainer.Title>{t("resetPass")}</InfoContainer.Title>
              <InfoContainer.Input
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </InfoContainer.InputContainer>
            <InfoContainer.Button disabled={!email} onClick={handleVerifyClick}>
              {t("sendVer")}
            </InfoContainer.Button>
          </RightContainer.InfoContainer>
        </Base.RightContainer>
      </Base>
    </>
  );
}
