import Base from "../components/Base/145MeetRelated";
import { ArrowLeftOutlined } from "@ant-design/icons";
import styled from "styled-components";
import Button from "../components/Button";
import { useMeet } from "./hooks/useMeet";
import { useNavigate } from "react-router-dom";
import { RWD } from "../constant";
const { RWDHeight, RWDFontSize } = RWD;
const PrimaryButton = Button("primary");

const ErrorContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  row-gap: ${RWDHeight(120)};
  p {
    color: #ffa601;
    font-size: ${RWDFontSize(80)};
    font-weight: 700;
    margin: 0;
  }
`;

const Error = () => {
  const { login } = useMeet();
  const navigate = useNavigate();
  return (
    <Base login={login}>
      <Base.FullContainer
        style={{
          gridColumn: "1/4",
          gridRow: "2/4",
          backgroundColor: "#FDF3D1",
        }}
      >
        <ErrorContainer>
          <p>Page not exists</p>
          <PrimaryButton
            onClick={() => {
              navigate("/");
            }}
          >
            <ArrowLeftOutlined />
            Home Page
          </PrimaryButton>
        </ErrorContainer>
      </Base.FullContainer>
    </Base>
  );
};

export default Error;
