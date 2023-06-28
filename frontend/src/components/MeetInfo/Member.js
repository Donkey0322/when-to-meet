/*TODO:********************************************************************************************
  1.Style, hover 時框框的 border
**************************************************************************************************/
import { Dropdown, Spin, ConfigProvider, Tooltip } from "antd";
import _, { parseInt } from "lodash";
import { useCallback, useState, useEffect } from "react";
import styled from "styled-components";
import Tag from "../Tag";
import Button from "../../components/Button";
import { RWD } from "../../constant";
import { useMeet } from "../../containers/hooks/useMeet";
const { RWDHeight, RWDFontSize, RWDWidth, RWDRadius } = RWD;
const MemberTag = Tag("member");
const RectButton = Button("rect");

const MenuItem = styled.div`
  width: ${RWDWidth(290)};
  overflow: auto;
  display: flex;
  align-items: center;
  ::-webkit-scrollbar {
    height: 2px;
  }
  ::-webkit-scrollbar-thumb {
    /* height: 20px; */
    background-color: #d8d8d8;
    height: 1px;
    &:hover {
      /* background-color: ; */
    }
  }
`;

const Member = ({ setMeetData, Input, rawMember = [] }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [member, setMember] = useState(rawMember);
  const [currentMember, setCurrentMember] = useState({
    username: "",
    id: "",
    email: "",
  }); //準備加入的 member
  const [selectedKeys, setSelectedKeys] = useState([]); //MouseDown 設置
  const [open, setOpen] = useState(false); //打開 dropdown
  const [input, setInput] = useState(""); //Input 裡的文字
  const {
    USERINFO: { ID },
    MIDDLEWARE: { searchMember },
  } = useMeet();

  const handleSearchMember = async (key) => {
    try {
      const {
        data: { accounts },
      } = await searchMember({ identifier: key });
      setUsers(
        accounts.length !== 0
          ? accounts.map((m) => ({
              key: m.username,
              label: (
                <MenuItem
                  data-id={m.id}
                  data-username={m.username}
                  data-email={m.email}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column" }}
                    data-id={m.id}
                    data-username={m.username}
                    data-email={m.email}
                  >
                    <div
                      style={{ fontSize: RWDFontSize(20) }}
                      data-id={m.id}
                      data-username={m.username}
                      data-email={m.email}
                    >
                      {m.username}
                    </div>
                    <div
                      style={{ fontSize: RWDFontSize(12), color: "#575757" }}
                      data-id={m.id}
                      data-username={m.username}
                      data-email={m.email}
                    >
                      {m.email}
                    </div>
                  </div>
                </MenuItem>
              ),
            }))
          : [
              {
                key: "No Result",
                label: <MenuItem>No Result</MenuItem>,
                disabled: true,
              },
            ]
      );
      setLoading(false);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (loading) {
      setUsers([
        {
          key: "loading",
          label: (
            <MenuItem>
              <Spin />
            </MenuItem>
          ),
          disabled: true,
        },
      ]);
    }
  }, [loading]);

  const debounceSearchMember = useCallback(
    _.debounce(handleSearchMember, 800),
    []
  );

  const handleInputChange = (e) => {
    const {
      target: { value },
    } = e;
    setInput(value);
    setLoading(Boolean(value));
    setSelectedKeys([]);
    setOpen(Boolean(value));
    setCurrentMember({
      username: "",
      id: "",
      email: "",
    });
    if (value?.includes("@")) {
      setCurrentMember({ username: "", id: "", email: value });
    }
    if (value) {
      debounceSearchMember(value);
    }
  };

  const handleMemberJoin = () => {
    if (currentMember?.id) {
      setMeetData((prev) => ({
        ...prev,
        member_ids: [...prev.member_ids, currentMember?.id],
      }));
      if (member.find((m) => m?.email === currentMember?.email)) {
        setMeetData((prev) => ({
          ...prev,
          emails: prev.emails.filter((email) => email !== currentMember.email),
        }));
        setMember((prev) =>
          prev.filter((m) => m.email !== currentMember.email)
        );
      }
    } else {
      setOpen(false);
      setMeetData((prev) => ({
        ...prev,
        emails: [...prev.emails, currentMember?.email],
      }));
    }
    setMember((prev) => [...prev, currentMember]);

    setCurrentMember({ username: "", id: "", email: "" });
    setInput("");
  };

  const handleMemberSelect = (e) => {
    setSelectedKeys([e.target.dataset.username]);
  };

  const handleMemberClick = (e) => {
    const { username, id, email } = e.domEvent.target.dataset;
    setCurrentMember({ username, id: parseInt(Number(id)), email });
    setInput(username);
    setOpen(false);
  };

  const handleMemberDelete = (item) => () => {
    if (item.id) {
      setMeetData((prev) => ({
        ...prev,
        member_ids: prev.member_ids.filter((id) => id !== item.id),
      }));
      setMember((prev) => prev.filter((m) => m.id !== item.id));
    } else if (item.email) {
      setMeetData((prev) => ({
        ...prev,
        emails: prev.emails.filter((email) => email !== item.email),
      }));
      setMember((prev) => prev.filter((m) => m.email !== item.email));
    } else {
      setMeetData((prev) => ({
        ...prev,
        remove_guest_names: [
          ...prev.remove_guest_names,
          item.username.replace("guest_"),
        ],
      }));
      setMember((prev) => prev.filter((m) => m.username !== item.username));
    }
  };
  const checkMemberInclude = () => {
    if (currentMember?.id) {
      return Boolean(member.find((m) => m?.email === currentMember?.email)?.id);
    } else {
      return Boolean(member.find((m) => m?.email === currentMember?.email));
    }
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", rowGap: RWDHeight(6) }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: RWDWidth(400),
          justifyContent: "space-between",
        }}
      >
        <ConfigProvider
          theme={{
            components: {
              Dropdown: {
                paddingXXS: 0,
                controlItemBgHover: "#F0F0F0",
                controlItemBgActive: "#D8D8D8",
                controlItemBgActiveHover: "#D8D8D8",
                colorPrimary: "#000000",
                borderRadiusSM: 0,
                borderRadiusOuter: 10,
              },
            },
          }}
        >
          <Dropdown
            overlayStyle={{
              width: RWDWidth(350),
              maxWidth: RWDWidth(350),
              minWidth: RWDWidth(350),
            }}
            menu={{
              items: users,
              selectedKeys,
              onClick: handleMemberClick,
              onMouseDown: handleMemberSelect,
            }}
            placement="bottomLeft"
            open={open}
          >
            <Input value={input} onChange={handleInputChange} />
          </Dropdown>
          <Tooltip
            open={checkMemberInclude() || (ID && ID === currentMember?.id)}
            title={
              ID === currentMember?.id
                ? "連你自己都不認識嗎？ㄏㄚˋㄌㄚˋ"
                : "already as member"
            }
          >
            <RectButton
              buttonTheme="#5A8EA4"
              variant="solid"
              style={{
                width: RWDWidth(42),
                height: RWDHeight(35),
                fontSize: RWDFontSize(24),
              }}
              onClick={handleMemberJoin}
              disabled={
                !currentMember.email ||
                (ID && ID === currentMember?.id) || //就是 create meet 的人
                checkMemberInclude() // 框框中已經有這人了
              }
            >
              +
            </RectButton>
          </Tooltip>
        </ConfigProvider>
      </div>

      {member.length > 0 && (
        <div
          style={{
            width: RWDWidth(400),
            height: RWDHeight(106),
            border: `${RWDRadius(1)} solid #808080`,
            borderRadius: RWDFontSize(15),
          }}
        >
          <div
            style={{
              margin: `${RWDFontSize(8)} ${RWDFontSize(12)}`,
              display: "flex",
              flexWrap: "wrap",
              alignContent: "flex-start",
              gap: `${RWDFontSize(8)} ${RWDFontSize(8)}`,
              overflowY: "auto",
              height: "90%",
            }}
          >
            {member.map((item, index) => (
              <MemberTag
                key={index}
                closable
                onClose={handleMemberDelete(item)}
              >
                {item.username ? item.username : item.email}
              </MemberTag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Member;
// export default <></>;
