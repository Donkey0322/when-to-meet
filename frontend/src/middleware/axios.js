import axios from "axios";
export default axios.create({
  baseURL: `${
    process.env.REACT_APP_SERVER_USE_HTTPS === "true" ? "https" : "http"
  }://${process.env.REACT_APP_SERVER_DOMAIN}:${
    process.env.REACT_APP_SERVER_PORT
  }`,
});

// console.log(bool(strtobool(process.env.REACT_APP_SERVER_USE_HTTPS)));
