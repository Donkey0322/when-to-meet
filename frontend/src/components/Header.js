import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { Button, ConfigProvider } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useMeet } from "../containers/hooks/useMeet";
import Title from "../components/Title";
import _ from "lodash";
import { RWD } from "../constant";
import { useTranslation } from "react-i18next";
const { RWDFontSize, RWDRadius, RWDHeight, RWDWidth } = RWD;

const HeaderContainer = styled.div`
  width: 100%;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const URLContainer = styled.div`
  width: calc(100% * 25 / 35);
  display: flex;
  height: 100%;
  align-items: center;
  background-color: #ffffff;
  z-index: 2;
  > div {
    width: calc(100% / 3);
    max-width: calc(100% / 3); //很可疑
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    /* border: 1px solid black; */
    cursor: pointer;
    > div {
      font-size: ${RWDFontSize(24)};
      color: #808080;
      font-weight: 700;
      letter-spacing: 1px;
    }
  }
`;

/**
 * @param   {Object} prop
 * @param   {Object} prop.show
 * @param   {boolean} prop.show.title 最左邊的 title
 * @param   {boolean} prop.show.navbar NavBar 功能列
 * @param   {boolean} prop.show.login login 狀態
 */
const Header = (prop) => {
  const { removeCookie, setLogin } = useMeet();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const ref = useRef(); //追蹤 header 們距離有無太擠
  const [adjusted, setAdjusted] = useState(false);
  const { pathname } = useLocation();

  const {
    show: { title, navbar, login },
  } = prop;
  //login 是 undefined 則不顯示按鈕
  const NavItem = [
    {
      name: t("meets"),
      //login 是 undefined 則不顯示按鈕
      to: "/meets",
      regex: [/^\/meets$/, /^\/voting\/.*$/, /^\/meets\/.*$/],
    },
    { name: t("calendar"), to: "/calendar", regex: [/^\/calendar$/] },
    {
      name: t("routine"),
      to: "/routine",
      regex: [/^\/routine$/],
    },
  ];

  const throttledHandleResize = _.throttle(() => {
    if (ref?.current?.children) {
      setAdjusted(
        Math.max(
          ...[...ref?.current?.children].map(
            (m) => m?.children?.[0].offsetWidth
          )
        ) >
          (window.innerWidth * 25) / 300
      );
    }
  }, 500);

  useEffect(() => {
    if (ref?.current?.children) {
      setAdjusted(
        Math.max(
          ...[...ref?.current?.children].map(
            (m) => m?.children?.[0].offsetWidth
          )
        ) >
          (window.innerWidth * 25) / 300
      );
    } //load 時
    window.addEventListener("resize", throttledHandleResize);
    return () => {
      window.removeEventListener("resize", throttledHandleResize);
    };
  }, []);

  return (
    <HeaderContainer
      style={{ ...prop?.style, borderBottom: !title && !navbar && "none" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: adjusted ? "65vw" : "35vw",
          height: "100%",
        }}
      >
        {title && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "calc(100% * 10 / 35)",
              height: "100%",
              cursor: "pointer",
              backgroundColor: "#ffffff",
            }}
            onClick={() => {
              navigate("/");
            }}
          >
            <Title
              style={{
                fontSize: "3vmin",
              }}
            >
              Let's Meet
            </Title>
          </div>
        )}
        {navbar && (
          <URLContainer ref={ref}>
            {NavItem.map((n, index) => (
              <div
                key={index}
                style={{
                  backgroundColor:
                    n?.regex.some((regex) => regex.test(pathname)) && "#fdf3d1",
                }}
                onClick={() => {
                  navigate(n.to);
                }}
              >
                {/* 置中 */}
                <div
                  style={{
                    color:
                      n?.regex.some((regex) => regex.test(pathname)) &&
                      "#DB8600",
                  }}
                >
                  {n.name}
                </div>
              </div>
            ))}
          </URLContainer>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          columnGap: "3vmin",
          marginRight: "3vw",
        }}
      >
        {!(login === undefined) &&
          (login ? (
            <>
              <Button
                type="link"
                style={{
                  fontSize: "2.2vmin",
                  color: "#808080",
                  height: "100%",
                  fontWeight: 600,
                  padding: 0,
                  border: 0,
                }}
              >
                {t("settings")}
              </Button>
              <Button
                type="link"
                icon={<LogoutOutlined />}
                style={{
                  fontSize: "2.3vmin",
                  color: "#808080",
                  height: "100%",
                  padding: 0,
                  border: 0,
                }}
                onClick={() => {
                  removeCookie("token");
                  setLogin(false);
                }}
              />
            </>
          ) : (
            <ConfigProvider
              theme={{
                components: {
                  Button: {
                    colorBgTextHover: "#FFF4CC",
                    colorBgTextActive: "#B76A00",
                    colorText: "#FFA601",
                  },
                },
              }}
            >
              <Button
                type="text"
                style={{
                  borderRadius: RWDRadius(30),
                  width: RWDWidth(80),
                  height: RWDHeight(42),
                  fontSize: RWDFontSize(16),
                  minHeight: "fit-content",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #FFA601",
                }}
                onClick={() => {
                  navigate("/login");
                }}
              >
                {t("login")}
              </Button>
            </ConfigProvider>
          ))}
      </div>
    </HeaderContainer>
  );
};

export default Header;
