/*TODO:********************************************************************************************
  1.RWD, 頁面高度縮小會導致 input 內容比框框大
**************************************************************************************************/
import styled, { css } from "styled-components";
import { forwardRef } from "react";
import {
  Input as AntdInput,
  Form,
  ConfigProvider,
  DatePicker,
  TimePicker,
} from "antd";
import { RWD } from "../constant";
const { RWDWidth, RWDHeight, RWDFontSize, RWDRadius } = RWD;

const InputEffect = {
  controlTmpOutline: "rgba(0, 0, 0, 0)",
  controlOutline: "rgba(0, 0, 0, 0)",
  colorPrimaryHover: "#B76A00",
  colorBorder: "#808080",
};

const InputStyle = css`
  width: ${RWDWidth(350)};
  border-radius: ${RWDRadius(10)};
  font-size: ${RWDFontSize(16)};
  display: flex;
  align-items: center;
  min-height: fit-content;
`;

const BaseInput = styled(AntdInput)`
  ${InputStyle};
`;

const BasePassword = styled(AntdInput.Password)`
  ${InputStyle};
  input {
    &::-ms-reveal,
    &::-ms-clear {
      display: none;
    }
    height: 90%;
  }
`;

const BaseTextArea = styled(AntdInput.TextArea)`
  width: ${RWDWidth(400)};
  height: ${RWDHeight(106)};
  border-radius: ${RWDFontSize(15)};
`;

const INPUTTYPE = ["main", "shorter", "thinner"];

const Input = (type) =>
  forwardRef((prop, ref) => {
    if (!INPUTTYPE.includes(type)) {
      throw new Error(
        `請定義 Input 種類，有以下可以選擇：\n${INPUTTYPE.join(", ")}`
      );
    }
    let { style } = prop;
    switch (type) {
      case "main":
        style = { height: RWDHeight(45), ...style };
        break;
      case "thinner":
        style = { height: RWDHeight(35), ...style };
        break;
      case "shorter":
        style = { height: RWDHeight(45), width: RWDWidth(250), ...style };
        break;
      default:
        break;
    }
    return (
      <ConfigProvider
        theme={{
          components: {
            Input: InputEffect,
          },
        }}
      >
        {/* <Form autoComplete="off"> */}
        <BaseInput {...prop} ref={ref} style={style} />
        {/* </Form> */}
      </ConfigProvider>
    );
  });

Input.Password = (type) =>
  forwardRef((prop, ref) => {
    if (!INPUTTYPE.includes(type)) {
      throw new Error(
        `請定義 Input 種類，有以下可以選擇：\n${INPUTTYPE.join(", ")}`
      );
    }
    let { style } = prop;
    switch (type) {
      case "main":
        style = { height: RWDHeight(45), ...style };
        break;
      case "thinner":
        style = { height: RWDHeight(35), ...style };
        break;
      case "shorter":
        style = { height: RWDHeight(45), width: RWDWidth(250), ...style };
        break;
      default:
        break;
    }
    return (
      <ConfigProvider
        theme={{
          components: {
            Input: InputEffect,
          },
        }}
      >
        {/* <Form autoComplete="off"> */}
        <BasePassword {...prop} ref={ref} style={style} />
        {/* </Form> */}
      </ConfigProvider>
    );
  });

Input.TextArea = forwardRef((prop, ref) => (
  <ConfigProvider
    theme={{
      components: {
        Input: InputEffect,
      },
    }}
  >
    <BaseTextArea {...prop} ref={ref} />
  </ConfigProvider>
));

const TIMETYPE = ["time", "date"];
const PICKERTYPE = ["range", "picker"];

Input.Time = (time, picker) =>
  forwardRef((prop, ref) => {
    if (!TIMETYPE.includes(time) || !PICKERTYPE.includes(picker)) {
      throw new Error(
        `請定義 Time 種類，有以下可以選擇：\n${TIMETYPE.join(", ")}\n` +
          `請定義 Picker 種類，有以下可以選擇：\n${PICKERTYPE.join(", ")}`
      );
    }
    let Component;
    switch (time) {
      case "time":
        Component = TimePicker;
        break;
      case "date":
        Component = DatePicker;
        break;
      default:
        break;
    }

    let { style } = prop;
    style = {
      height: RWDHeight(32),
      fontSize: RWDFontSize(14),
      minHeight: "fit-content",
      ...style,
    };
    switch (picker) {
      case "range":
        style = { width: RWDWidth(350), ...style };
        Component = Component.RangePicker;
        break;
      case "picker":
        style = { width: RWDWidth(150), ...style };
        break;
      default:
        break;
    }

    return (
      <ConfigProvider
        theme={{
          components: {
            DatePicker: {
              ...InputEffect,
              colorPrimary: "#7A3E00",
            },
            TimePicker: InputEffect,
          },
        }}
      >
        <Component {...prop} ref={ref} style={style} />
      </ConfigProvider>
    );
  });

export default Input;
