import { Switch, ConfigProvider } from "antd";
import { useState, useEffect } from "react";

const SWITCHTHEME = {
  "#5A8EA4": {
    default: "#5A8EA4",
    hover: "#B3DEE5",
    active: "#31525B",
  },
};

export default ({ switchTheme, ...prop }) => {
  if (!Object.keys(SWITCHTHEME).includes(switchTheme)) {
    throw new Error(
      `請定義 Switch 主題顏色，有以下可以選擇：\n${Object.keys(
        SWITCHTHEME
      ).join(", ")}`
    );
  }
  const [theme, setTheme] = useState({ default: "", hover: "", active: "" });

  useEffect(() => {
    setTheme({
      default: SWITCHTHEME[switchTheme].default,
      hover: SWITCHTHEME[switchTheme].hover,
      active: SWITCHTHEME[switchTheme].active,
    });
  }, [SWITCHTHEME]);

  return (
    <ConfigProvider
      theme={{
        components: {
          Switch: {
            controlTmpOutline: "rgba(0, 0, 0, 0)",
            controlOutline: "rgba(0, 0, 0, 0)",
            colorPrimary: theme.default,
            colorPrimaryHover: theme.hover,
          },
        },
      }}
    >
      <Switch {...prop} />
    </ConfigProvider>
  );
};
