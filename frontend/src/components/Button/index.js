/*TODO:********************************************************************************************
  1. Button, disalbed 時的提示語
**************************************************************************************************/
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button as AntdButton, Image, ConfigProvider } from "antd";
import { useState, useEffect } from "react";
import styled from "styled-components";
import BUTTONTHEME from "./theme";
import { RWD } from "../../constant";
import { useMeet } from "../../containers/hooks/useMeet";
const { RWDWidth, RWDRadius, RWDFontSize, RWDHeight } = RWD;

const BUTTONTYPE = [
  "primary",
  "google",
  "back",
  "rect",
  "round",
  "pill",
  "line",
];

const BaseButton = styled(AntdButton)`
  display: flex;
  justify-content: center;
  align-items: center;
  div {
    display: none;
  }
`;

const PillButton = styled(BaseButton)`
  border-radius: ${RWDRadius(50)};
  /* min-width: ${RWDWidth(55)}; */
  height: ${RWDHeight(25)};
  width: fit-content;
  font-size: ${RWDFontSize(12)};
`;

const PrimaryButton = styled(PillButton)`
  font-weight: 800;
  font-size: ${RWDFontSize(20)};
  min-width: ${RWDWidth(130)};
  height: ${RWDHeight(55)};
`;

const LongButton = styled(BaseButton)`
  width: 100%;
  height: ${RWDHeight(70)};
  background: white;
  /* border: ${RWDRadius(1)} solid #808080; */
  border-radius: ${RWDRadius(15)};
  column-gap: ${RWDWidth(20)};
  font-size: ${RWDFontSize(21)};
  font-weight: 900;
  div {
    display: block;
  }
`;

const RoundButton = styled(BaseButton)`
  border-radius: 50%;
  aspect-ratio: 1;
  width: fit-content;
`;

const RectButton = styled(BaseButton)`
  border-radius: ${RWDRadius(5)};
  width: ${RWDWidth(42)};
  height: ${RWDHeight(32)};
  font-size: ${RWDFontSize(14)};
  width: fit-content;
  height: fit-content;
  font-weight: 700;
`;

export default (type = "primary") => {
  if (!BUTTONTYPE.includes(type)) {
    throw new Error(
      `請定義 Button 種類，有以下可以選擇：\n${BUTTONTYPE.join(
        ", "
      )}\ncurrent: ${type}`
    );
  }
  let tempTheme;
  let tempVariant;
  switch (type) {
    case "primary":
      tempTheme = "#B3DEE5";
      tempVariant = "solid";
      break;
    case "back":
      tempTheme = "#D8D8D8";
      tempVariant = "text";
      break;
    case "google":
    case "line":
      tempTheme = "long";
      tempVariant = "hollow";
      break;
    default:
      break;
  }
  return ({ buttonTheme = tempTheme, variant = tempVariant, ...prop }) => {
    if (!Object.keys(BUTTONTHEME).includes(variant)) {
      throw new Error(
        `請定義 Button variant，有以下可以選擇：\n${Object.keys(
          BUTTONTHEME
        ).join(", ")}`
      );
    }
    if (!Object.keys(BUTTONTHEME[variant]).includes(buttonTheme)) {
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
    const {
      MIDDLEWARE: { googleLogin },
    } = useMeet();

    useEffect(() => {
      setTheme({
        ...BUTTONTHEME?.[variant]?.[buttonTheme],
        fontColor: BUTTONTHEME?.[variant]?.[buttonTheme]?.default?.color,
        borderColor: BUTTONTHEME?.[variant]?.[buttonTheme]?.default?.border,
      });
    }, [variant, buttonTheme]);

    const ThemeAlongMouseMove = (temp) => {
      setTheme((prev) => ({
        ...prev,
        fontColor: BUTTONTHEME?.[variant]?.[buttonTheme]?.[temp]?.color,
        borderColor: BUTTONTHEME?.[variant]?.[buttonTheme]?.[temp]?.border,
      }));
    };

    const mouseup = () => {
      if (down) {
        ThemeAlongMouseMove("default");
      }
      setDown(false);
    };

    useEffect(() => {
      window.addEventListener("mouseup", mouseup);
      return () => {
        window.removeEventListener("mouseup", mouseup);
      };
    }, [down]);

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
        Component = LongButton;
        prop.onClick = () => {
          googleLogin();
        };
        break;
      case "line":
        Component = LongButton;
        break;
      case "primary":
        Component = PrimaryButton;
        break;
      case "back":
        Component = RoundButton;
        prop.icon = <ArrowLeftOutlined />;
        break;
      case "rect":
        Component = RectButton;
        break;
      case "round":
        Component = RoundButton;
        break;
      case "pill":
        Component = PillButton;
        break;
      default:
        break;
    }
    return (
      <ConfigProvider
        theme={{
          components: {
            Button: {
              controlTmpOutline: "none",
              controlOutline: "none",
              colorPrimary: theme?.default?.backgroundColor,
              colorPrimaryHover: theme?.hover?.backgroundColor,
              colorPrimaryActive: theme?.active?.backgroundColor,
              colorTextLightSolid: theme?.fontColor,
            },
          },
        }}
      >
        <Component
          type="primary"
          {...{
            ...prop,
            style: {
              ...prop.style,
              border: prop.disabled ? "none" : prop.style.border,
            },
          }}
        >
          {["google", "line"].includes(type) && (
            <Image
              width={RWDFontSize(30)}
              src={require(`./asset/${
                (prop.disabled ? "disable_" : "") + type
              }.png`)}
              preview={false}
            />
          )}
          {prop.children}
        </Component>
      </ConfigProvider>
    );
  };
};
