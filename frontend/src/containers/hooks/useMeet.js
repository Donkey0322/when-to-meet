import jwt from "jwt-decode";
import { useState, useContext, createContext, useEffect } from "react";
import { useCookies } from "react-cookie";
const MeetContext = createContext({
  login: false,
  error: "",
  loading: false,
  ID: 0,
});

const MeetProvider = (props) => {
  const [cookies, setCookie, removeCookie] = useCookies(["token"]);
  const [login, setLogin] = useState(cookies.token ?? false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ID, setID] = useState(0);

  const GLOBAL_LOGIN = (token) => {
    const decoded = jwt(token);
    console.log(decoded);
    setCookie("token", token, { path: "/", expires: new Date(decoded.expire) });
    setLogin(true);
  };

  useEffect(() => {
    if (cookies.token) {
      setLogin(true);
    }
  }, [cookies]);

  return (
    <MeetContext.Provider
      value={{
        login,
        cookies,
        error,
        loading,
        setError,
        setLogin,
        setLoading,
        setCookie,
        removeCookie,
        GLOBAL_LOGIN,
      }}
      {...props}
    />
  );
};

const useMeet = () => useContext(MeetContext);

export { MeetProvider, useMeet };
