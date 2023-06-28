/*TODO:********************************************************************************************
  1. Style, hover 時的特效。
**************************************************************************************************/
import { ArrowRightOutlined } from "@ant-design/icons";
import { Table, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { useMeet } from "./hooks/useMeet";
import Base from "../components/Base/145MeetRelated";
import Button from "../components/Button";
import Search from "../components/Search";
import Tag from "../components/Tag";
import { RWD } from "../constant";
import slotIDProcessing from "../util/slotIDProcessing";

const { RWDHeight, RWDWidth } = RWD;
const MemberTag = Tag("member");
const StatusTag = Tag("status");
const RoundButton = Button("round");
const RectButton = Button("rect");

const tagMap = {
  Voted: {
    color: "#808080",
    border: "1px solid #D8D8D8",
    backgroundColor: "#FFFFFF",
  },
  Confirming: {
    color: "#808080",
    border: "1px solid #D8D8D8",
    backgroundColor: "#FFFFFF",
  },
  Unvoted: {
    color: "#FFA601",
    border: "1px solid #FFA601",
    backgroundColor: "#FFFFFF",
  },
  Confirmed: {
    color: "#FFA601",
    border: "1px solid #FFA601",
    backgroundColor: "#FFFFFF",
  },
  "Need Confirmation": {
    color: "#FFFFFF",
    border: "none",
    backgroundColor: "#FFA601",
  },
};

const MeetContainer = styled.div`
  width: ${RWDWidth(1488)};
  position: relative;
  margin-top: ${RWDHeight(100)};
  display: flex;
  flex-direction: column;
  row-gap: ${RWDHeight(30)};
  thead .meetTableColumn {
    background-color: #fdf3d1 !important;
    color: #7a3e00 !important;
    border-bottom: 1px solid #7a3e00 !important;
  }

  thead .ant-table-cell-scrollbar {
    background-color: #fdf3d1 !important;
    border-bottom: 1px solid #7a3e00 !important;
  }

  tbody .meetTableColumn {
    overflow-x: auto;
  }

  /* .ant-table-body {
    overflow: auto auto !important;
  } */
`;

const CONFIRMTAG = ["Confirming", "Confirmed", "Need Confirmation"];

const Meets = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    login,
    setLoading,
    MIDDLEWARE: { browseMeet },
    moment: { moment },
  } = useMeet();
  const [meetsData, setMeetsData] = useState({});
  const [view, setView] = useState("Voting");
  const [filter, setFilter] = useState({ Voting: [], "Ended Votes": [] });

  const tagLangMapping = (status) => {
    switch (status) {
      case "Voted":
        return t("voted");
      case "Unvoted":
        return t("unvoted");
      case "Confirmed":
        return t("confirmed");
      case "Confirming":
        return t("confirming");
      case "Need Confirmation":
        return t("needConfirmation");
      default:
        return;
    }
  };

  const customizeRenderEmpty = () => (
    <div style={{ textAlign: "center" }}>
      <p>{t("noData")}</p>
    </div>
  );

  const handleMeetInfoClick = (code) => (e) => {
    navigate(`/meets/${code}`);
  };

  useEffect(() => {
    (async () => {
      if (login) {
        setLoading(true);
        const { data } = await browseMeet();
        setMeetsData(
          data.reduce(
            (acc, curr) => {
              const target = {
                key: curr.meet_id,
                name: curr.title,
                host: curr.host_username,
                code: curr.invite_code,
                votingPeriod: `${curr.start_date.replaceAll(
                  "-",
                  "/"
                )} ~ ${curr.end_date.replaceAll("-", "/")}`,
                votingDeadline: curr.voting_end_time
                  ? moment(curr.voting_end_time).format("YYYY/MM/DD HH:mm")
                  : "",
                status: curr.status,
                meetingTime: curr.finalized_start_date
                  ? `${curr.finalized_start_date} ` +
                    slotIDProcessing(curr.finalized_start_time_slot_id)
                  : "",
                url: curr.meet_url,
              };
              acc[
                CONFIRMTAG.includes(curr.status) ? "Ended Votes" : "Voting"
              ].push(target);
              return acc;
            },
            { Voting: [], "Ended Votes": [] }
          )
        );
        setLoading(false);
      } else {
        navigate("/");
      }
    })();
  }, [login]);

  useEffect(() => {
    if (meetsData.Voting) {
      setFilter({
        Voting: [...new Set(meetsData.Voting.map((m) => m.status))],
        "Ended Votes": [
          ...new Set(meetsData["Ended Votes"].map((m) => m.status)),
        ],
      });
    }
  }, [meetsData]);

  const columns = [
    {
      title: t("name"),
      dataIndex: "name",
      key: "name",
      width: 150,
      render: (i) => <div style={{ overflowX: "auto" }}>{i}</div>,
      ...Search("name"),
    },
    {
      title: t("host"),
      dataIndex: "host",
      key: "host",
      width: 150,
      render: (tag) => <MemberTag>{tag}</MemberTag>,
      ...Search("host"),
    },
    {
      title: t("votingPeriod"),
      dataIndex: "votingPeriod",
      key: "votingPeriod",
      width: 220,
      render: (i) => <div style={{ overflowX: "auto" }}>{i}</div>,
    },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (tag) => (
        <StatusTag key={tag} style={tagMap[tag]}>
          {tagLangMapping(tag)}
        </StatusTag>
      ),
      filters: filter[view].map((f) => ({ text: f, value: f })),
      onFilter: (value, { status }) => status.indexOf(value) === 0,
    },
    {
      width: 200,
      title: view === "Voting" ? t("votingDeadline") : t("meetingTime"),
      dataIndex: view === "Voting" ? "votingDeadline" : "meetingTime",
      key: view === "Voting" ? "votingDeadline" : "meetingTime",
    },
    {
      title: t("url"),
      dataIndex: "url",
      key: "url",
      width: 280,
      // width: "fit-content",
      render: (url) =>
        url ? (
          <a
            target="_blank"
            href={url}
            style={{ color: "#000000", textDecoration: "underline" }}
            rel="noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {url}
          </a>
        ) : (
          t("none")
        ),
    },
    {
      title: "",
      dataIndex: "action",
      align: "right",
      fixed: "right",
      width: 80,
      render: () => (
        <RoundButton
          variant="text"
          buttonTheme="#D8D8D8"
          icon={<ArrowRightOutlined />}
          // onClick={handleMeetInfoClick}
        />
      ),
    },
  ].map((m) => ({
    ...m,
    className: m.title ? "meetTableColumn" : "meetTableColumn icon",
  }));

  return (
    <Base login={true}>
      <Base.FullContainer>
        <MeetContainer>
          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "30px",
              }}
            >
              {t("myMeets")}
            </div>
            <div
              style={{
                display: "flex",
                columnGap: RWDWidth(15),
                alignItems: "center",
              }}
            >
              <RectButton
                buttonTheme="#5A8EA4"
                variant={view === "Voting" ? "solid" : "hollow"}
                onClick={() => {
                  setView("Voting");
                }}
              >
                {t("voting")}
              </RectButton>
              <RectButton
                buttonTheme="#5A8EA4"
                variant={view === "Voting" ? "hollow" : "solid"}
                onClick={() => {
                  setView("Ended Votes");
                }}
              >
                {t("endedVotes")}
              </RectButton>
            </div>
          </div>
          <ConfigProvider
            renderEmpty={customizeRenderEmpty}
            theme={{
              token: {
                colorPrimary: "#7A3E00",
                colorLink: "#7A3E00",
                controlItemBgActive: "#FFE699",
                colorLinkHover: "#FFE699",
                colorLinkActive: "#FFC340",
                controlItemBgActiveHover: "#FFC340",
              },
              components: {
                Table: {
                  borderRadiusLG: 0,
                  colorFillAlter: "#F0F0F0",
                },
              },
            }}
          >
            <Table
              style={{ width: "100%", overflowX: "auto" }}
              dataSource={meetsData[view]}
              columns={columns}
              scroll={{
                // y: 400,
                x: 1000,
              }}
              onRow={(record) => {
                return {
                  onClick: handleMeetInfoClick(record.code),
                };
              }}
              pagination={{ hideOnSinglePage: true }}
            />
          </ConfigProvider>
        </MeetContainer>
      </Base.FullContainer>
    </Base>
  );
};

export default Meets;
