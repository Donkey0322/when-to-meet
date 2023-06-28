export default (baseURL, token) => ({
  googleLogin: async () => {
    try {
      window.open(`${baseURL}/google-login`, "_self");
    } catch (error) {
      throw error;
    }
  },
  lineConnect: async () => {
    try {
      window.open(`${baseURL}/line?token=${token}`, "_self");
    } catch (error) {
      throw error;
    }
  },
  lineJoin: () => {
    let params = `scrollbars = no, resizable = no, status = no, location = no, toolbar = no, menubar = no , width = 500 , height = 500`;
    window.open("https://line.me/R/ti/p/@766ivmyp", "_blank", params);
  },
});
