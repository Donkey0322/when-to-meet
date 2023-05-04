/*TODO:********************************************************************************************
  1.RWD, 頁面高度縮小會導致 input 內容比框框大
**************************************************************************************************/
import styled, { css } from "styled-components";
import { forwardRef } from "react";
import { Input as AntdInput, Form, ConfigProvider } from "antd";
import { RWD } from "../constant";
const { RWDVmin, RWDWidth, RWDHeight, RWDFontSize, RWDRadius } = RWD;

const InputStyle = css`
  width: ${RWDWidth(350)};
  border: ${RWDVmin(1)} solid #808080;
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
  input::-ms-reveal,
  input::-ms-clear {
    display: none;
  }
`;

const INPUTTYPE = ["main", "shorter", "thinner"];

const Input = (type) =>
  forwardRef((prop, ref) => {
    if (!INPUTTYPE.includes(type)) {
      throw new Error(
        `請定義 Input 種類，有以下可以選擇：\n${INPUTTYPE.join(", ")}`
      );
    }
    let style;
    switch (type) {
      case "main":
        style = { height: RWDHeight(45) };
        break;
      case "thinner":
        style = { height: RWDHeight(35) };
        break;
      case "shorter":
        style = { height: RWDHeight(45), width: RWDWidth(250) };
        break;
      default:
        break;
    }
    return (
      <ConfigProvider
        theme={{
          components: {
            Input: {
              controlTmpOutline: "rgba(0, 0, 0, 0)",
              controlOutline: "rgba(0, 0, 0, 0)",
              colorPrimaryHover: "#B76A00",
            },
          },
        }}
      >
        <Form autoComplete="off">
          <BaseInput {...prop} ref={ref} style={style} />
        </Form>
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
    let style;
    switch (type) {
      case "main":
        style = { height: RWDHeight(45) };
        break;
      case "thinner":
        style = { height: RWDHeight(35) };
        break;
      case "shorter":
        style = { height: RWDHeight(45), width: RWDWidth(250) };
        break;
      default:
        break;
    }
    return (
      <ConfigProvider
        theme={{
          components: {
            Input: {
              controlTmpOutline: "rgba(0, 0, 0, 0)",
              controlOutline: "rgba(0, 0, 0, 0)",
              colorPrimaryHover: "#B76A00",
            },
          },
        }}
      >
        <Form autoComplete="off">
          <BasePassword {...prop} ref={ref} style={style} />
        </Form>
      </ConfigProvider>
    );
  });

export default Input;
