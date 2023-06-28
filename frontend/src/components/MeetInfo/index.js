import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import dayjs from "dayjs";
import { range } from "lodash";
import React, { useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Member from "./Member";
import Input from "../Input";
import Switch from "../Switch";
import { RWD } from "../../constant";
import { useMeet } from "../../containers/hooks/useMeet";
import slotIDProcessing from "../../util/slotIDProcessing";
const ThinnerInput = Input("thinner");
const TextArea = Input.TextArea;
const DatePicker = Input.Time("date", "picker");
const TimePicker = Input.Time("time", "picker");
const DateRange = Input.Time("date", "range");
const TimeRange = Input.Time("time", "range");
const { RWDWidth, RWDHeight, RWDFontSize } = RWD;

const CONFIRM_INEDITABLE = [
  "Start / End Date",
  "Start / End Time",
  "Voting Deadline",
];

const MeetInfoContainer = Object.assign(
  styled.div`
    display: grid;
    grid-template-columns: repeat(2, max-content);
    grid-template-rows: repeat(7, max-content);
    grid-column-gap: ${({ columnGap }) => RWDWidth(columnGap)};
    grid-row-gap: ${({ rowGap }) => RWDHeight(rowGap)};
  `,
  {
    Content: styled.div`
      display: flex;
      align-items: center;
      font-size: ${RWDFontSize(20)};
      font-weight: bold;
    `,
  }
);

/**
 * @example
 * const CreateMeet = styled.div`
    display: grid;
    grid-template-columns: repeat(2, max-content);
    grid-template-rows: repeat(8, max-content);
    `;
*/
const MeetInfo = ({
  columnGap,
  rowGap,
  handleMeetDataChange = () => {},
  login,
  setMeetData,
  ElementMeetInfo,
  rawMeetInfo,
  reviseMode = true,
  confirmed = false,
  member,
  ...prop
}) => {
  const { t } = useTranslation();
  const {
    moment: { moment },
  } = useMeet();
  const [votingddl, setVotingddl] = useState(
    rawMeetInfo?.voting_end_time ? true : false
  );
  const CONTENTMENU = {
    "Meet Time": null,
    "Meet Name": (
      <ThinnerInput
        onChange={handleMeetDataChange((i) => i.target.value, "meet_name")}
        data-required={true}
        value={rawMeetInfo?.meet_name}
      />
    ),
    "Start / End Date": (
      <DateRange
        placeholder={[t("startDate"), t("endDate")]}
        onChange={handleMeetDataChange(
          (i) => moment(i.toISOString()).format("YYYY-MM-DD"),
          "start_date",
          "end_date"
        )}
        data-required={true}
        // value={[undefined, undefined]}
        value={
          rawMeetInfo?.start_date
            ? [dayjs(rawMeetInfo?.start_date), dayjs(rawMeetInfo?.end_date)]
            : undefined
        }
        disabledDate={(current) =>
          // Can not select days before today
          current && current < moment().subtract(1, "days").endOf("day")
        }
      />
    ),
    "Start / End Time": (
      <TimeRange
        placeholder={[t("startTime"), t("endTime")]}
        onChange={handleMeetDataChange(
          (i, plus) =>
            i.minute() === 59 ? 48 : (i.hour() * 60 + i.minute()) / 30 + plus,
          "start_time_slot_id",
          "end_time_slot_id"
        )}
        disabledTime={() => ({
          disabledMinutes: (hour) =>
            range(60).filter(
              (minute) =>
                minute !== 0 && minute !== 30 && (hour !== 23 || minute !== 59)
            ),
        })}
        hideDisabledOptions={true}
        format={"HH:mm"}
        data-required={true}
        value={
          rawMeetInfo?.start_time_slot_id
            ? [
                dayjs(
                  slotIDProcessing(rawMeetInfo?.start_time_slot_id),
                  "HH-mm"
                ),
                dayjs(
                  slotIDProcessing(rawMeetInfo?.end_time_slot_id + 1),
                  "HH-mm"
                ),
              ]
            : undefined
        }
      />
    ),
    Host: null,
    Member: (
      <Member
        setMeetData={setMeetData}
        Input={ThinnerInput}
        rawMember={member}
      />
    ),
    Description: (
      <TextArea
        onChange={handleMeetDataChange((i) => i.target.value, "description")}
        value={rawMeetInfo?.description}
      />
    ),
    "Voting Deadline": (
      <div
        style={{
          display: "flex",
          columnGap: RWDWidth(20),
          alignItems: "center",
          height: RWDHeight(32),
          width: RWDWidth(400),
          justifyContent: "space-between",
        }}
      >
        <Switch
          switchTheme="#5A8EA4"
          onChange={() => {
            setVotingddl((prev) => !prev);
          }}
          checked={votingddl}
        />
        {votingddl && (
          <>
            <DatePicker
              placeholder={t("selectDate")}
              onChange={handleMeetDataChange(
                (i) =>
                  i
                    ? rawMeetInfo?.voting_end_time
                      ? moment(
                          `${moment(i.toISOString()).format(
                            "YYYY-MM-DD"
                          )} ${moment(rawMeetInfo?.voting_end_time).format(
                            "HH-mm-ss"
                          )}`,
                          "YYYY-MM-DD HH-mm-ss"
                        ).toISOString()
                      : i.toISOString()
                    : undefined,
                "voting_end_time"
              )}
              value={
                rawMeetInfo?.voting_end_time
                  ? dayjs(rawMeetInfo?.voting_end_time)
                  : undefined
              }
              disabledDate={(current) =>
                // Can not select days before today and today
                current && current < moment().endOf("day")
              }
            />
            <TimePicker
              placeholder={t("selectTime")}
              onChange={handleMeetDataChange(
                (i) =>
                  i
                    ? rawMeetInfo?.voting_end_time
                      ? moment(
                          `${moment(rawMeetInfo?.voting_end_time).format(
                            "YYYY-MM-DD"
                          )} ${moment(i.toISOString()).format("HH-mm-ss")}`,
                          "YYYY-MM-DD HH-mm-ss"
                        ).toISOString()
                      : i.toISOString()
                    : undefined,
                "voting_end_time"
              )}
              value={
                rawMeetInfo?.voting_end_time
                  ? dayjs(rawMeetInfo?.voting_end_time)
                  : undefined
              }
            />
          </>
        )}
      </div>
    ),
    "Invitation URL": null,
    "Google Meet URL": (
      <Switch
        switchTheme="#5A8EA4"
        data-info={login !== "google"}
        disabled={login !== "google"}
        onChange={handleMeetDataChange((i) => i, "gen_meet_url")}
        checked={rawMeetInfo?.gen_meet_url}
      />
    ),
  };

  const CONTENTNAME = {
    "Meet Name": t("meetName"),
    "Start / End Date": t("startDate"),
    "Start / End Time": t("startTime"),
    Host: t("host"),
    Member: t("member"),
    Description: t("description"),
    "Voting Deadline": t("votingDeadline"),
    "Invitation URL": t("invitationURL"),
    "Google Meet URL": t("url"),
  };

  return (
    <MeetInfoContainer columnGap={columnGap} rowGap={rowGap} {...prop}>
      {Object.keys(CONTENTMENU)
        .filter((m) =>
          reviseMode ? CONTENTMENU[m] : m !== "Meet Name" && ElementMeetInfo[m]
        )
        .map((title, index) => (
          <Fragment key={index}>
            <MeetInfoContainer.Content
              style={{
                gridColumn: "1/2",
                gridRow: `${index + 1}/${index + 2}`,
                alignSelf:
                  (title === "Description" || title === "Member") &&
                  "flex-start",
                columnGap: RWDWidth(4),
              }}
            >
              <div>{CONTENTNAME[title] ?? title}</div>
              {reviseMode && CONTENTMENU[title]?.props["data-required"] && (
                <div
                  style={{
                    fontFamily: "Courier New",
                    alignSelf: "flex-start",
                  }}
                >
                  &#1645;
                </div>
              )}
              {reviseMode && CONTENTMENU[title]?.props["data-info"] && (
                <Tooltip
                  title="Connect with Google to enable"
                  color="#FFFFFF"
                  overlayInnerStyle={{
                    color: "#000000",
                  }}
                >
                  <InfoCircleOutlined
                    style={{
                      marginLeft: RWDWidth(4),
                      cursor: "pointer",
                      color: "darkgray",
                      fontWeight: "bold",
                    }}
                  />
                </Tooltip>
              )}
            </MeetInfoContainer.Content>
            <MeetInfoContainer.Content
              style={{
                gridColumn: "2/3",
                gridRow: `${index + 1}/${index + 2}`,
                fontWeight: "normal",
              }}
            >
              {reviseMode && (!confirmed || !CONFIRM_INEDITABLE.includes(title))
                ? CONTENTMENU[title]
                : ElementMeetInfo[title]}
            </MeetInfoContainer.Content>
          </Fragment>
        ))}
    </MeetInfoContainer>
  );
};

MeetInfo.Title = styled.p`
  font-size: ${RWDFontSize(30)}; //max(1.6vw, 20px);
  font-weight: bold;
  margin: 0;
`;

export default MeetInfo;
