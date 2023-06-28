import { InfoCircleFilled } from "@ant-design/icons";
import { Modal, Form } from "antd";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Button from "./Button";
import Input from "./Input";
import MeetInfo from "./MeetInfo";
import { RWD } from "../constant";
const RectButton = Button("rect");
const MainInput = Input("main");
const MainPassword = Input.Password("main");
const { RWDWidth, RWDHeight, RWDFontSize } = RWD;

const ContentContainer = Object.assign(
  styled(Form)`
    width: ${RWDWidth(393)};
    min-width: max-content;
    height: fit-content;
    display: flex;
    flex-direction: column;
    position: relative;
  `,
  {
    Title: styled.div`
      font-weight: 700;
    `,
    Time: styled.div`
      font-weight: 500;
    `,
    Footer: styled.div`
      margin: 0;
      align-self: flex-end;
      display: flex;
      column-gap: ${RWDWidth(18)};
      margin-top: ${RWDHeight(24)};
    `,
  }
);

/**
 * @example
 * const CellHoverContainer = styled.div`
    width: ${RWDWidth(165)};
    display: flex;
    justify-content: space-between;
    color: #000000;
  `;
*/
const CellHoverContainer = Object.assign(
  styled.div`
    min-width: 165px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    /* justify-content: space-between; */
    color: #000000;
  `,
  {
    /**
     * @example
     * const CellHoverInfo = styled.div`
        display: flex;
        flex-direction: column;
        align-items: center;
        row-gap: ${RWDHeight(5)};
      `;
    */
    CellHoverInfo: styled.div`
      display: flex;
      flex-direction: column;
      align-items: center;
      row-gap: ${RWDHeight(5)};
    `,
  }
);

const MODALTYPE = ["guestName", "confirm", "info", "leave", "calendar"];

export default (type) => {
  if (!MODALTYPE.includes(type)) {
    throw new Error(
      `請定義 Modal 種類，有以下可以選擇：\n${MODALTYPE.join(", ")}`
    );
  }

  return ({ open, setOpen, onOk, onCancel, ...prop }) => {
    const { t } = useTranslation();

    let Component;
    switch (type) {
      case "info":
        const { available_members = [], unavailable_members = [] } = prop;
        return (
          <CellHoverContainer>
            <CellHoverContainer.CellHoverInfo style={{ gridColumn: "1/2" }}>
              <div
                style={{
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Availble
              </div>
              {available_members.map((m, index) => (
                <div key={index}>{m}</div>
              ))}
            </CellHoverContainer.CellHoverInfo>
            <CellHoverContainer.CellHoverInfo style={{ gridColumn: "2/3" }}>
              <div
                style={{
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Unavailble
              </div>
              {unavailable_members.map((m, index) => (
                <div key={index}>{m}</div>
              ))}
            </CellHoverContainer.CellHoverInfo>
          </CellHoverContainer>
        );
      case "guestName":
        const { handleFormChange, form } = prop;
        Component = (
          <ContentContainer
            style={{
              position: "relative",
              rowGap: RWDHeight(35),
            }}
          >
            <Form.Item
              name="username"
              rules={[
                {
                  required: true,
                  message: "Username is required",
                },
                {
                  pattern: /^[^#$%&*/?@]*$/,
                  validateTrigger: "onChange",
                  message: "Please avoid `#$%&*/?@",
                },
                {
                  pattern: /^(?!guest_).*/,
                  validateTrigger: "onChange",
                  message: "Please avoid using guest_ as prefix.",
                },
              ]}
              style={{ margin: 0 }}
              onChange={handleFormChange("username")}
            >
              <MainInput addonBefore="guest_" placeholder="Your name" />
            </Form.Item>
            <Form.Item
              style={{ margin: 0 }}
              onChange={handleFormChange("password")}
            >
              <MainPassword placeholder="Password (optional)" />
            </Form.Item>
            <Form.Item style={{ margin: 0, alignSelf: "flex-end" }}>
              <RectButton
                htmlType="submit"
                buttonTheme="#B8D8BA"
                variant="solid"
                onClick={onOk}
                disabled={
                  !form.username ||
                  !/^[^#$%&*/?@]*$/.test(form.username) ||
                  !/^(?!guest_).*/.test(form.username)
                }
              >
                OK
              </RectButton>
            </Form.Item>
          </ContentContainer>
        );
        break;
      case "confirm":
        const { meetName, time } = prop;
        Component = (
          <ContentContainer>
            <ContentContainer.Title>
              {`Time of ${meetName} is`}
            </ContentContainer.Title>
            <ContentContainer.Time>{time}</ContentContainer.Time>
            <ContentContainer.Footer>
              <RectButton
                buttonTheme="#D8D8D8"
                variant="hollow"
                onClick={onCancel}
              >
                Cancel
              </RectButton>
              <RectButton buttonTheme="#DB8600" variant="solid" onClick={onOk}>
                Confirm
              </RectButton>
            </ContentContainer.Footer>
          </ContentContainer>
        );
        break;
      case "calendar":
        const { elementMeetInfo } = prop;
        Component = (
          <ContentContainer style={{ width: RWDWidth(650) }}>
            <ContentContainer.Title
              style={{ marginBottom: RWDHeight(30), fontSize: RWDFontSize(30) }}
            >
              {elementMeetInfo["Meet Name"]}
            </ContentContainer.Title>
            <MeetInfo
              columnGap={60}
              rowGap={20}
              ElementMeetInfo={elementMeetInfo}
              reviseMode={false}
            />
            <ContentContainer.Footer style={{ marginTop: RWDHeight(30) }}>
              <RectButton buttonTheme="#DB8600" variant="solid" onClick={onOk}>
                Go to Meet Detail
              </RectButton>
            </ContentContainer.Footer>
          </ContentContainer>
        );
        break;
      case "leave":
        const { host } = prop;
        Component = (
          <ContentContainer>
            <ContentContainer.Title
              style={{
                display: "flex",
                alignItems: "center",
                columnGap: RWDWidth(12),
              }}
            >
              <InfoCircleFilled style={{ color: "#FAAD14" }} />
              <span>{host ? t("deleteConfirm") : t("leaveConfirm")}</span>
            </ContentContainer.Title>
            <ContentContainer.Footer style={{ marginTop: RWDHeight(47) }}>
              <RectButton
                buttonTheme="#B8D8BA"
                variant="solid"
                onClick={
                  onCancel ??
                  (() => {
                    setOpen(false);
                  })
                }
              >
                {t("no")}
              </RectButton>
              <RectButton buttonTheme="#B8D8BA" variant="hollow" onClick={onOk}>
                {t("yes")}
              </RectButton>
            </ContentContainer.Footer>
          </ContentContainer>
        );
        break;
      default:
        break;
    }
    return (
      <Modal
        forceRender
        centered
        closable={false}
        footer={null}
        onCancel={
          onCancel ??
          (() => {
            setOpen(false);
          })
        }
        open={open}
        title=""
        width="fit-content"
      >
        {Component}
      </Modal>
    );
  };
};
