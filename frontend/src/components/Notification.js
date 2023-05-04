import { notification as AntdNotification, ConfigProvider } from "antd";
import React, { useEffect, useState, useMemo } from "react";
import { RWD } from "../constant";
const { RWDFontSize } = RWD;

const Notification = ({ message, notification, setNotification }) => {
  const [api, contextHolder] = AntdNotification.useNotification();
  const [margin, setMargin] = useState(undefined);

  useEffect(() => {
    if (notification?.message !== undefined) {
      setMargin(notification?.message ? { number: 8 } : { number: 0 });
    }
  }, [notification]);

  useEffect(() => {
    if (margin !== undefined) {
      console.log(margin.number);
      api.open({
        message: notification?.title,
        description: (
          <div style={{ fontWeight: 400 }}>{notification?.message}</div>
        ),
        placement: "top",
        duration: 20,
        closeIcon: <></>,
        style: {
          fontSize: RWDFontSize(20),
          fontWeight: 700,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          border: "1px solid#D8D8D8",
          boxShadow: "none",
        },
      });
      setNotification({ title: undefined, message: undefined });
    }
  }, [margin]);

  return (
    <ConfigProvider
      theme={{
        token: {
          marginXS: margin?.number,
          borderRadiusLG: 15,
        },
      }}
    >
      {contextHolder}
    </ConfigProvider>
  );
};

export default Notification;
