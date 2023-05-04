/**************************************************************************************************
 DONE!
**************************************************************************************************/
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as AXIOS from "../../middleware";
import Base from "../../components/Base/orange3_white7";
import { RWD } from "../../constant";
import { useTranslation } from 'react-i18next';
const { InfoContainer } = Base.RightContainer;
const { RWDHeight } = RWD;

const ChangePassword = () => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState({
    "New Password": "",
    "Confirmed New Password": "",
  });
  const search = useLocation().search;
  const navigate = useNavigate();

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setNewPassword((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClick = async () => {
    try {
      console.log(newPassword);
      const result = await AXIOS.resetPassword({
        password: newPassword["New Password"],
        code: new URLSearchParams(search).get("code"),
      });
      navigate("/login");
    } catch (e) {
      alert(e);
      console.log(e);
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
};

export default ChangePassword;
