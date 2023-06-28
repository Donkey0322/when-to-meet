import print from "./test";

export default (instance) => ({
  getGroupAvailability: async (code) => {
    try {
      if (print)
        console.log(
          "GET",
          `/meet/code/${code}/available_time/all`,
          "req:",
          code
        );
      const { data: result } = await instance.get(
        `/meet/code/${code}/available_time/all`
      );
      if (print)
        console.log(
          "GET",
          `/meet/code/${code}/available_time/all`,
          "res",
          result
        );
      return result;
    } catch (error) {
      throw error;
    }
  },
  getMyAvailability: async (code, name = undefined, password = undefined) => {
    try {
      if (print)
        console.log(
          "GET",
          `/meet/code/${code}/available_time`,
          "req:",
          code,
          name,
          password
        );
      const { data: result } = await instance.get(
        `/meet/code/${code}/available_time`,
        { params: { name, password } }
      );
      if (print)
        console.log("GET", `/meet/code/${code}/available_time`, "res", result);
      return result;
    } catch (error) {
      throw error;
    }
  },
  addMyAvailability: async (code, data) => {
    try {
      if (print)
        console.log("POST", `/meet/code/${code}/available_time`, "req:", data);
      const { data: result } = await instance.post(
        `/meet/code/${code}/available_time`,
        data
      );
      if (print)
        console.log("POST", `/meet/code/${code}/available_time`, "res", result);
      return result;
    } catch (error) {
      throw error;
    }
  },
  deleteMyAvailability: async (code, data) => {
    try {
      if (print)
        console.log(
          "DELETE",
          `/meet/code/${code}/available_time`,
          "req:",
          data
        );
      const { data: result } = await instance.delete(
        `/meet/code/${code}/available_time`,
        { data }
      );
      if (print)
        console.log(
          "DELETE",
          `/meet/code/${code}/available_time`,
          "res",
          result
        );
      return result;
    } catch (error) {
      throw error;
    }
  },
  confirmMeet: async (code, data) => {
    try {
      if (print)
        console.log("POST", `/meet/code/${code}/confirm`, "req:", data);
      const { data: result } = await instance.post(
        `/meet/code/${code}/confirm`,
        data
      );
      if (print)
        console.log("POST", `/meet/code/${code}/confirm`, "res", result);
      return result;
    } catch (error) {
      throw error;
    }
  },
});
