import { BrowserRouter, Routes, Route } from "react-router-dom";
import { message } from "antd";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useMeet } from "./containers/hooks/useMeet";
import Main from "./containers/orange3_white7/Mainpage";
import Login from "./containers/orange3_white7/Login";
import Signup from "./containers/orange3_white7/Signup";
import Reset from "./containers/orange3_white7/ResetPassword";
import Change from "./containers/orange3_white7/ChangePassword";
import Meets from "./containers/Meets";
import MeetInfo from "./containers/MeetInfo";
import Voting from "./containers/Voting";
import Routine from "./containers/orange3_white7/Routine";
import Error from "./containers/Error";
function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const { error, setError } = useMeet();

  useEffect(() => {
    if (error) {
      messageApi.open({
        type: "error",
        content: error,
        duration: 1,
      });
      setError("");
    }
  }, [error]);

  return (
    // <CssBaseline />
    <>
      {contextHolder}
      <BrowserRouter>
        <AnimatePresence>
          <Routes>
            <Route element={<Main />} path="/" />
            <Route element={<Meets />} path="/meets" />
            <Route element={<MeetInfo />} path="/meets/:code"></Route>
            <Route element={<Login />} path="/login" />
            <Route element={<Signup />} path="/signup" />
            <Route element={<Reset />} path="/reset" />
            <Route element={<Change />} path="/reset-password" />
            <Route element={<Voting />} path="/voting/:code" />
            <Route element={<Routine />} path="/routine" />
            {/* <Route element={<Test />} path="/test" /> */}
            <Route element={<Error />} path="*"></Route>
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </>
  );
}

export default App;
