import { Radio, ConfigProvider } from "antd";
import { useState, useEffect } from "react";

const RADIOTHEME = {
  "#DB8600": {
    default: "#DB8600",
    hover: "#FFC340",
    active: "#935000",
  },
};

export default ({ radioTheme, value, elements, ...prop }) => {
  if (!Object.keys(RADIOTHEME).includes(radioTheme)) {
    throw new Error(
      `請定義 Radio 主題顏色，有以下可以選擇：\n${Object.keys(RADIOTHEME).join(
        ", "
      )}`
    );
  }
  const [theme, setTheme] = useState({ default: "", hover: "", active: "" });

  useEffect(() => {
    setTheme({
      default: RADIOTHEME[radioTheme].default,
      hover: RADIOTHEME[radioTheme].hover,
      active: RADIOTHEME[radioTheme].active,
    });
  }, [RADIOTHEME]);

  return (
    <ConfigProvider
      theme={{
        components: {
          Radio: {
            colorPrimary: theme.default,
          },
        },
      }}
    >
      <Radio.Group value={value} {...prop}>
        {elements.map((e, index) => (
          <Radio {...e.props} key={index} value={e.value}>
            {e.label}
          </Radio>
        ))}
      </Radio.Group>
    </ConfigProvider>
  );
};
