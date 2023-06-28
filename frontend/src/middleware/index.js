import POST from "./simplePost";
import GET from "./simpleGet";
import PATCH from "./simplePatch";
import DELETE from "./simpleDelete";
import MEET from "./meet";
import VOTING from "./votingTable";
import THIRDPARTY from "./thirdParty";
import axios from "axios";

const baseURL = `${
  process.env.REACT_APP_SERVER_USE_HTTPS === "true" ? "https" : "http"
}://${process.env.REACT_APP_SERVER_DOMAIN}:${
  process.env.REACT_APP_SERVER_PORT
}`;

export default function middleware(token) {
  const instance = axios.create({
    baseURL,
    headers: { "auth-token": token },
  });
  return {
    ...POST(instance),
    ...DELETE(instance),
    ...GET(instance),
    ...PATCH(instance),
    ...VOTING(instance),
    ...THIRDPARTY(baseURL, token),
    ...MEET(instance),
  };
}
