import instance from "./axios";

export const getGroupAvailability = async (code, token = undefined) => {
  try {
    console.log("req:", code);
    const { data: result } = await instance.get(
      `/meet/code/${code}/available_time/all`,
      token && { headers: { "auth-token": token } }
    );
    console.log("res", result);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getMyAvailability = async (
  code,
  token = undefined,
  name = undefined
) => {
  try {
    console.log("req:", code, name);
    const { data: result } = await instance.get(
      `/meet/code/${code}/available_time`,
      token && { headers: { "auth-token": token } }
    );
    console.log("res", result);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const addMyAvailability = async (code, data, token = undefined) => {
  try {
    console.log("req:", data);
    const { data: result } = await instance.post(
      `/meet/code/${code}/available_time`,
      data,
      token && { headers: { "auth-token": token } }
    );
    console.log("res", result);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteMyAvailability = async (code, data, token = undefined) => {
  try {
    console.log("req:", data);
    const { data: result } = await instance.delete(
      `/meet/code/${code}/available_time`,
      {
        data,
        headers: token && { "auth-token": token },
      }
    );
    console.log("res", result);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
