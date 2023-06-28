import print from "./test";

const URL = {
  logIn: "/login",
  signUp: "/account",
  forgetPassword: "/forget-password",
  resetPassword: "/reset-password",
  addMeet: "/meet",
  addRoutine: "/routine",
};

export default function POST(instance) {
  return Object.keys(URL).reduce((acc, curr) => {
    acc[curr] = async (data) => {
      try {
        if (print) console.log("POST", URL[curr], "req:", data);
        const { data: result } = await instance.post(URL[curr], data);
        if (print) console.log("POST", URL[curr], "res", result);
        return result;
      } catch (error) {
        throw error;
      }
    };
    return acc;
  }, {});
}
