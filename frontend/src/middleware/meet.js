import instance from "./axios";

const METHOD = {
  read: instance.get,
  join: instance.post,
  leave: instance.delete,
  update: instance.patch,
};

export default (method) =>
  async (code, token, data = {}) => {
    if (!Object.keys(METHOD).includes(method)) {
      throw new Error(
        `請定義 method，有以下可以選擇：\n${Object.keys(METHOD).join(", ")}`
      );
    }
    instance.defaults.headers["auth-token"] = token;
    try {
      console.log(code, token, data);
      const route = `/meet/code/${code}`;
      const { data: result } = await METHOD[method](route, data);
      console.log("res", result);
      return result;
    } catch (error) {
      throw error;
    }
  };
