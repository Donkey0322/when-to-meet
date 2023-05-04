/*TODO:********************************************************************************************
  1. Button, disalbed 時的提示語
**************************************************************************************************/
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button as AntdButton, Tooltip, Image, ConfigProvider } from "antd";
import { useState, useEffect } from "react";
import styled from "styled-components";
import BUTTONTHEME from "./theme";
import { RWD } from "../../constant";
import { googleLogin } from "../../middleware";
const { RWDWidth, RWDRadius, RWDFontSize, RWDHeight } = RWD;

const BUTTONTYPE = ["primary", "secondary", "google", "back", "modal", "rect"];

const BaseButton = styled(AntdButton)`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PrimaryButton = styled(BaseButton)`
  border-radius: ${RWDRadius(50)};
  font-weight: 800;
  font-size: ${RWDFontSize(20)};
  min-width: ${RWDWidth(130)};
  height: ${RWDHeight(55)};
  width: fit-content;

  /* color: "#000000"; */
  /* &:disabled {
    cursor: default;
    pointer-events: all !important;
  } */
`;

const GoogleButton = styled(BaseButton)`
  width: 100%;
  height: ${RWDHeight(70)};
  background: white;
  border: ${RWDRadius(1)} solid #808080;
  border-radius: ${RWDRadius(15)};
  column-gap: ${RWDWidth(20)};
  font-size: ${RWDFontSize(21)};
  font-weight: 900;
`;

const BackButton = styled(BaseButton)`
  border-radius: 50%;
`;

const ModalButton = styled(BaseButton)`
  border-radius: ${RWDRadius(5)};
  width: ${RWDWidth(42)};
  height: ${RWDHeight(32)};
  font-size: ${RWDFontSize(14)};
`;

const RectButton = styled(ModalButton)`
  width: fit-content;
  height: fit-content;
  font-weight: 700;
`;

export default (type = "primary") => {
  let tempTheme;
  let tempVariant;
  switch (type) {
    case "primary":
      tempTheme = "#B3DEE5";
      tempVariant = "solid";
      break;
    case "back":
      tempTheme = "#D8D8D8";
      tempVariant = "round";
      break;
    default:
      tempVariant = "hollow";
      break;
  }
  return ({ buttonTheme = tempTheme, variant = tempVariant, ...prop }) => {
    if (!BUTTONTYPE.includes(type)) {
      throw new Error(
        `請定義 Button 種類，有以下可以選擇：\n${BUTTONTYPE.join(", ")}`
      );
    }
    if (
      type !== "google" &&
      !Object.keys(BUTTONTHEME[variant]).includes(buttonTheme)
    ) {
      throw new Error(
        `請定義 ${variant} Button 主題顏色，有以下可以選擇：\n${Object.keys(
          BUTTONTHEME[variant]
        ).join(", ")}`
      );
    }
    const [theme, setTheme] = useState({
      ...BUTTONTHEME?.[variant]?.[buttonTheme],
      fontColor: BUTTONTHEME?.[variant]?.[buttonTheme]?.default?.color,
      borderColor: BUTTONTHEME?.[variant]?.[buttonTheme]?.default?.border,
    });
    const [down, setDown] = useState(false);

    const ThemeAlongMouseMove = (temp) => {
      setTheme((prev) => ({
        ...prev,
        fontColor: BUTTONTHEME?.[variant]?.[buttonTheme]?.[temp]?.color,
        borderColor: BUTTONTHEME?.[variant]?.[buttonTheme]?.[temp]?.border,
      }));
    };

    document.addEventListener("mouseup", () => {
      if (down) {
        ThemeAlongMouseMove("default");
      }
      setDown(false);
    });

    prop.style = { ...prop.style, border: `1px solid ${theme.borderColor}` };

    prop.onMouseEnter = () => {
      if (!down) {
        ThemeAlongMouseMove("hover");
      }
    };
    prop.onMouseDown = () => {
      setDown(true);
      ThemeAlongMouseMove("active");
    };
    prop.onMouseLeave = () => {
      if (!down) {
        ThemeAlongMouseMove("default");
      }
    };

    let Component;
    switch (type) {
      case "google":
        return (
          <GoogleButton
            {...prop}
            onClick={() => {
              googleLogin();
            }}
          >
            <Image
              width={RWDFontSize(30)}
              src={require("./google.png")}
              preview={false}
            />
            {prop.children}
          </GoogleButton>
        );
      case "primary":
        Component = (
          <Tooltip title={"待補"} placement="bottom">
            <PrimaryButton {...prop} type="primary">
              {prop.children}
            </PrimaryButton>
          </Tooltip>
        );
        break;
      case "back":
        Component = (
          <BackButton type="primary" icon={<ArrowLeftOutlined />} {...prop} />
        );
        break;
      case "modal":
        Component = (
          <ModalButton type="primary" {...prop}>
            {prop.children}
          </ModalButton>
        );
        break;
      case "rect":
        Component = (
          <RectButton type="primary" {...prop}>
            {prop.children}
          </RectButton>
        );
      default:
        break;
    }
    return (
      <ConfigProvider
        theme={{
          components: {
            Button: {
              controlTmpOutline: "rgba(0, 0, 0, 0)",
              controlOutline: "rgba(0, 0, 0, 0)",
              colorPrimary: theme?.default?.backgroundColor,
              colorPrimaryHover: theme?.hover?.backgroundColor,
              colorPrimaryActive: theme?.active?.backgroundColor,
              colorTextLightSolid: theme?.fontColor,
            },
          },
        }}
      >
        {Component}
      </ConfigProvider>
    );
  };
};
