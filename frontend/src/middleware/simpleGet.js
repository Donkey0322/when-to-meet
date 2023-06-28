import print from "./test";

const URL = {
  searchMember: "/account/search",
  browseMeet: "/meet",
  emailVerification: "/email-verification",
  getRoutine: "/routine",
  getCalendar: "/meet-calendar",
  getGoogleCalendar: "/google-calendar",
  getUserInfo: "/account",
  lineToken: "/account/line",
};

export default (instance) =>
  Object.keys(URL).reduce((acc, curr) => {
    acc[curr] = async (params = undefined, route = undefined) => {
      try {
        if (print) console.log("GET", URL[curr], "req:", params, route);
        const { data: result } = await instance.get(
          `${URL[curr]}${route ? `/${route}` : ""}`,
          {
            params,
          }
        );
        if (print) console.log("GET", URL[curr], "res", result);
        return result;
      } catch (error) {
        throw error;
      }
    };
    return acc;
  }, {});
