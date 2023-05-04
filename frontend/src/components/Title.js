import { forwardRef } from "react";
import styled from "styled-components";
import { RWD } from "../constant";
const { RWDFontSize } = RWD;

const TitleComponent = styled.div`
  font-style: normal;
  font-weight: 500;
  font-size: ${RWDFontSize(80)};
  color: #ffa601;
  font-family: "Lobster";
  width: fit-content;
  margin: 0;
`;

const Title = forwardRef(({ style, children }, ref) => (
  <TitleComponent style={style} ref={ref}>
    {children}
  </TitleComponent>
));

export default Title;
