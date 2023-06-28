import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useMeet } from "../hooks/useMeet";
import Base from "../../components/Base/orange3_white7";
import { RWD } from "../../constant";
const { InfoContainer } = Base.RightContainer;
const { RWDHeight } = RWD;

export default function ChangePassword() {
  const search = useLocation().search;
  const {
    MIDDLEWARE: { resetPassword },
  } = useMeet();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState({
    "New Password": "",
    "Confirmed New Password": "",
  });
  const { t } = useTranslation();

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setNewPassword((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClick = async () => {
    try {
      await resetPassword({
        password: newPassword["New Password"],
        code: new URLSearchParams(search).get("code"),
      });
      navigate("/login");
    } catch (e) {
      alert(e);
    }
  };

  return (
    <Base>
      <Base.RightContainer>
        <InfoContainer
          style={{
            justifyContent: "space-evenly",
            height: RWDHeight(375),
          }}
        >
          <InfoContainer.InputContainer
            style={{
              marginTop: RWDHeight(10),
            }}
          >
            <InfoContainer.Title>{t("resetPass")}</InfoContainer.Title>
            {Object.keys(newPassword).map((m, index) => (
              <InfoContainer.Password
                placeholder={m}
                key={index}
                name={m}
                onChange={handleResetChange}
              />
            ))}
          </InfoContainer.InputContainer>
          <InfoContainer.Button
            disabled={
              newPassword["Confirmed New Password"] !==
              newPassword["New Password"]
            }
            onClick={handleClick}
          >
            {t("save")}
          </InfoContainer.Button>
        </InfoContainer>
      </Base.RightContainer>
    </Base>
  );
}
