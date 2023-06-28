import { BrowserRouter, Routes, Route } from "react-router-dom";
import { message } from "antd";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useMeet } from "./containers/hooks/useMeet";
import Main from "./containers/orange3_white7/MainPage";
import Login from "./containers/orange3_white7/Login";
import Signup from "./containers/orange3_white7/Signup";
import Reset from "./containers/orange3_white7/ResetPassword";
import Change from "./containers/orange3_white7/ChangePassword";
import Meets from "./containers/Meets";
import MeetInfo from "./containers/MeetInfo";
import Voting from "./containers/Voting";
import Confirm from "./containers/Confirm";
import Routine from "./containers/orange3_white7/Routine";
import Calendar from "./containers/Calendar";
import Error from "./containers/Error";
import Setting from "./containers/orange3_white7/Setting.js";
import Test from "./test/Test";
function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const { error, setError, login } = useMeet();

  // useEffect(() => {
  //   if (error) {
  //     messageApi.open({
  //       type: "error",
  //       content: error,
  //       duration: 3,
  //     });
  //     setError("");
  //   }
  // }, [error]);

  return (
    // <CssBaseline />
    <>
      {contextHolder}
      <BrowserRouter>
        <AnimatePresence>
          {login !== undefined && (
            <Routes>
              <Route element={<Main />} path="/" />
              <Route element={<Meets />} path="/meets" />
              <Route element={<MeetInfo />} path="/meets/:code" />
              <Route element={<Login />} path="/login" />
              <Route element={<Signup />} path="/signup" />
              <Route element={<Reset />} path="/reset" />
              <Route element={<Change />} path="/reset-password" />
              <Route
                element={error ? <Error /> : <Voting />}
                path="/voting/:code"
              />
              <Route
                element={error ? <Error /> : <Confirm />}
                path="/confirm/:code"
              />
              <Route element={<Routine />} path="/routine" />
              <Route element={<Calendar />} path="/calendar" />
              <Route element={<Setting />} path="/settings" />
              <Route element={<Test />} path="/test" />
              <Route element={<Error />} path="*" />
            </Routes>
          )}
        </AnimatePresence>
      </BrowserRouter>
    </>
  );
}

export default App;
