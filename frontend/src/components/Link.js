import { Typography, ConfigProvider } from "antd";

const LINKTHEME = {
  "#DB8600": {
    default: "#DB8600",
    hover: "#FFC340",
    active: "#935000",
  },
  "#808080": {
    default: "#808080",
    hover: "#808080",
    active: "#808080",
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
  return (
    <ConfigProvider
      theme={{
        components: {
          Typography: {
            controlTmpOutline: "rgba(0, 0, 0, 0)",
            controlOutline: "rgba(0, 0, 0, 0)",
            colorLink: LINKTHEME[linkTheme].default,
            colorLinkHover: LINKTHEME[linkTheme].hover,
            colorLinkActive: LINKTHEME[linkTheme].active,
          },
        },
      }}
    >
      <Typography.Link {...prop}>{prop.children}</Typography.Link>
    </ConfigProvider>
  );
};

export default Link;
