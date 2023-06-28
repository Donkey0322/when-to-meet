import print from "./test";

const URL = {
  editAccount: "/account",
  editPreference: "/account/notification-preference",
};

export default (instance) =>
  Object.keys(URL).reduce((acc, curr) => {
    acc[curr] = async (data) => {
      try {
        if (print) console.log("PATCH", URL[curr], "req:", data);
        const { data: result } = await instance.patch(URL[curr], data);
        if (print) console.log("PATCH", URL[curr], "res", result);
        return result;
      } catch (error) {
        throw error;
      }
    };
    return acc;
  }, {});
