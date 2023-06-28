import { Form } from "antd";
import { motion } from "framer-motion";
import styled from "styled-components";
import Button from "../Button";
import Footer from "../Footer.js";
import Grid from "../Grid.js";
import Header from "../Header";
import Input from "../Input";
import Title from "../Title.js";
import { RWD, PAGE_TRANSITION } from "../../constant";
const { RWDWidth, RWDRadius, RWDFontSize, RWDHeight } = RWD;
const MainInput = Input("main");
const PrimaryButton = Button("primary");
const MainPassword = Input.Password("main");
const { FadeIn } = PAGE_TRANSITION;

const FadeInContainer = (prop) => (
  <motion.div {...prop} variants={FadeIn} initial="initial" animate="animate">
    {prop.children}
  </motion.div>
);

const Base = (prop) => {
  const { children, title_disable = false, login = undefined } = prop;

  return (
    <Grid
      {...prop}
      column={[35, 65]}
      row={["7.5vh", "minmax(84vh, auto)", "8.5vh"]}
    >
      <Header
        style={{ gridRow: "1/2", gridColumn: "1/3" }}
        show={{ title: login, navbar: login, login }}
      />
      <div
        style={{
          gridColumn: "1/2",
          gridRow: "1/4",
          background: "#FDF3D1",
          display: "flex",
          position: "relative",
          justifyContent: "center",
          zIndex: -1,
        }}
      >
        {!title_disable && (
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <Title style={{ position: "relative", bottom: "20%" }}>
              Let's meet
            </Title>
          </div>
        )}
      </div>
      {children}
      <Footer style={{ gridColumn: "1/3", gridRow: "3/4" }} />
    </Grid>
  );
};

Base.LeftContainer = styled.div`
  grid-column: 1/2;
  grid-row: 1/4;
`;

/**
 * @example
 * const RightContainer = styled.div`
    grid-column: 2/3;
    grid-row: 1/4;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
*/
Base.RightContainer = Object.assign(
  styled.div`
    grid-column: 2/3;
    grid-row: 1/4;
    display: flex;
    justify-content: center;
    align-items: center;
  `,
  {
    /**
     * @example 
     * const InfoContainer = styled.div`
        width: ${RWDWidth(470)};
        height: auto;
        border: 1px solid #d8d8d8;
        border-radius: ${RWDRadius(15)};
        display: flex;
        flex-direction: column;
        align-items: center;
      `;
     */
    InfoContainer: Object.assign(
      styled(FadeInContainer)`
        width: ${RWDWidth(470)};
        height: auto;
        border: 1px solid #d8d8d8;
        border-radius: ${RWDRadius(15)};
        display: flex;
        flex-direction: column;
        align-items: center;
      `,
      {
        /**
         * @example
         * const InputContainer = styled.div`
            width: ${RWDWidth(350)};
            gap: ${RWDHeight(30)};
            display: flex;
            flex-direction: column;
          `;
        */
        InputContainer: styled(Form)`
          width: ${RWDWidth(350)};
          gap: ${RWDHeight(30)};
          display: flex;
          flex-direction: column;
        `,
        /**
         * @example
         * const Title = styled.div`
            ${main}
            font-weight: bold;
            font-size: ${RWDFontSize(30)};
            padding: 0;
            margin: 0;
          `;
        */
        Title: styled.h1`
          font-weight: bold;
          font-size: ${RWDFontSize(30)};
          padding: 0;
          margin: 0;
        `,
        Input: MainInput,
        /**
         * @example
         * const Password = styled.div`
            width: 100%;
            height: ${RWDHeight(45)};
            border-radius: ${RWDRadius(10)};
            font-size: ${RWDFontSize(16)};
            border: ${RWDRadius(1)} solid #808080;
            input::-ms-reveal,
            input::-ms-clear {
              display: none;
            }
          `;
        */
        Password: MainPassword,
        Button: (prop) => <PrimaryButton {...prop} />,
      }
    ),
  }
);

export default Base;
