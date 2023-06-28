import print from "./test";

export default (instance) => {
  const METHOD = {
    getMeetInfo: instance.get,
    joinMeet: instance.post,
    leaveMeet: instance.delete,
    editMeet: instance.patch,
  };

  return Object.keys(METHOD).reduce((acc, curr) => {
    acc[curr] = async (code, data = {}) => {
      try {
        const route = `/meet/code/${code}`;
        if (print) console.log(curr, route, "req", data);
        const { data: result } = await METHOD[curr](route, data);
        if (print) console.log("res", result);
        return result;
      } catch (error) {
        throw error;
      }
    };
    return acc;
  }, {});
};
