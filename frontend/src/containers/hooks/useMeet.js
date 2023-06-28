import jwt from "jwt-decode";
import { useState, useContext, createContext, useEffect, useMemo } from "react";
import { useCookies } from "react-cookie";
import AXIOS from "../../middleware";
import Moment, { moment as momentUtil } from "../../util/moment";

const MeetContext = createContext({
  login: false,
  error: "",
  loading: false,
  lang: "en",
  USERINFO: {},
  MIDDLEWARE: {},
  moment: {},
});

const MeetProvider = (props) => {
  const [cookies, setCookie, removeCookie] = useCookies(["token"]);
  const [login, setLogin] = useState(undefined);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [USERINFO, setUSERINFO] = useState({});
  const [lang, setLang] = useState("en");
  const MIDDLEWARE = useMemo(() => AXIOS(cookies.token), [cookies]);
  const moment = useMemo(
    () => ({
      Moment: (time, format) => Moment(lang)(time, format),
      moment: momentUtil,
    }),
    [lang]
  );
  const { getUserInfo } = MIDDLEWARE;

  const GLOBAL_LOGIN = (token) => {
    const { expire, is_google_login } = jwt(token);
    setCookie("token", token, { path: "/", expires: new Date(expire) });
    setLogin(is_google_login ? "google" : "notGoogle");
  };

  useEffect(() => {
    if (cookies.token) {
      setLogin(jwt(cookies.token).is_google_login ? "google" : "notGoogle");
    } else {
      setLogin(false);
    }
  }, [cookies]);

  useEffect(() => {
    (async () => {
      if (login) {
        const {
          data: { id: ID, ...rest },
        } = await getUserInfo(undefined, jwt(cookies.token).account_id);
        setUSERINFO({
          ID,
          ...rest,
        });
      } else {
        setUSERINFO({});
      }
    })();
  }, [login]);

  return (
    <MeetContext.Provider
      value={{
        login,
        error,
        loading,
        lang,
        USERINFO,
        setError,
        setLogin,
        setLoading,
        setLang,
        setUSERINFO,
        removeCookie,
        GLOBAL_LOGIN,
        MIDDLEWARE,
        moment,
      }}
      {...props}
    />
  );
};

const useMeet = () => useContext(MeetContext);

export { MeetProvider, useMeet };
