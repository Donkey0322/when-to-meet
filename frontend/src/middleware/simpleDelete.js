import instance from "./axios";
const URL = {
  deleteRoutine: "/routine",
};

export default Object.keys(URL).reduce((acc, curr) => {
  acc[curr] = async (data, token = undefined) => {
    try {
      console.log("req:", data);
      const { data: result } = await instance.delete(URL[curr], {
        data,
        headers: token && { "auth-token": token },
      });
      console.log("res", result);
      return result;
    } catch (error) {
      throw error;
    }
  };
  return acc;
}, {});
