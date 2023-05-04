import instance from "./axios";
const URL = {
  searchMember: "/account/search",
  browseMeet: "/meet",
  emailVerification: "/email-verification",
  getRoutine: "/routine",
};

export default Object.keys(URL).reduce((acc, curr) => {
  acc[curr] = async (
    params = undefined,
    token = undefined,
    route = undefined
  ) => {
    try {
      console.log("req:", params ?? token ?? route);
      const { data: result } = await instance.get(
        `${URL[curr]}${route ? `/${route}` : ""}`,
        {
          headers: { "auth-token": token },
          params,
        }
      );
      console.log("res", result);
      return result;
    } catch (error) {
      throw error;
    }
  };
  return acc;
}, {});
