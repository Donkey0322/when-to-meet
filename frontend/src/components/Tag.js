import styled from "styled-components";
import { Tag as AntdTag } from "antd";
import { RWD } from "../constant/";
const { RWDHeight, RWDFontSize, RWDRadius } = RWD;

const TAGTYPE = ["member", "status"];

const MemberTag = styled(AntdTag)`
  width: fit-content;
  height: ${RWDHeight(26)};
  min-height: 20px;
  border-radius: ${RWDRadius(10)};
  font-size: ${RWDFontSize(14)};
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0f6f5;
  border: 2px solid #e0f6f5;
  margin: 0;
  border-width: 0;
`;
const StatusTag = styled(AntdTag)`
  width: fit-content;
  height: ${RWDHeight(36)};
  min-height: 20px;
  border-radius: ${RWDRadius(30)};
  font-size: ${RWDFontSize(12)};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  /* border-width: 0; */
`;

const Tag = (type) => (prop) => {
  if (!type) {
    throw new Error(`請定義 Tag 種類，有以下可以選擇：\n${TAGTYPE.join(", ")}`);
  }
  let Component;
  switch (type) {
    case "member":
      Component = MemberTag;
      break;
    case "status":
      Component = StatusTag;
    default:
      break;
  }
  return <Component {...prop}>{prop.children}</Component>;
};

export default Tag;
