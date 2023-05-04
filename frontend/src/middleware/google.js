export const googleLogin = async () => {
  try {
    window.open(
      `${
        process.env.REACT_APP_SERVER_USE_HTTPS === "true" ? "https" : "http"
      }://${process.env.REACT_APP_SERVER_DOMAIN}:${
        process.env.REACT_APP_SERVER_PORT
      }/google-login`,
      "_self"
    );
  } catch (error) {
    throw error;
  }
};
