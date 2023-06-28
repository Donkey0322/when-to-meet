import { Typography, ConfigProvider } from "antd";
import { useState, useEffect } from "react";

const LINKTHEME = {
  "#DB8600": {
    default: "#DB8600",
    hover: "#FFC340",
    active: "#935000",
  },
  "#808080": {
    default: "#808080",
    hover: "#D8D8D8",
    active: "#575757",
  },
  "#5C9B6B": {
    default: "#5C9B6B",
    hover: "#5C9B6B",
    active: "#5C9B6B",
  },
};

const Link = ({ linkTheme, ...prop }) => {
  if (!Object.keys(LINKTHEME).includes(linkTheme)) {
    throw new Error(
      `請定義 Link 主題顏色，有以下可以選擇：\n${Object.keys(LINKTHEME).join(
        ", "
      )}`
    );
  }
  const [theme, setTheme] = useState({ default: "", hover: "", active: "" });

  useEffect(() => {
    setTheme({
      default: LINKTHEME[linkTheme].default,
      hover: LINKTHEME[linkTheme].hover,
      active: LINKTHEME[linkTheme].active,
    });
  }, [linkTheme]);

  return (
    <ConfigProvider
      theme={{
        components: {
          Typography: {
            controlTmpOutline: "rgba(0, 0, 0, 0)",
            controlOutline: "rgba(0, 0, 0, 0)",
            colorLink: theme.default,
            colorLinkHover: theme.hover,
            colorLinkActive: theme.active,
          },
        },
      }}
    >
      <Typography.Link {...prop}>{prop.children}</Typography.Link>
    </ConfigProvider>
  );
};

export default Link;
