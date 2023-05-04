import { keyframes, css } from "styled-components";
export const COLORS = {
  orange: {
    0: "#F0F0F0",
    1: "#FFF4CC",
    2: "#FFD466",
    3: "#FFC340",
    4: "#DB8600",
    5: "#935000",
  },
};

export const SIZES = {
  RWDWidth: (width) => `calc(100vw * ${width} / 1080)`,
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  // Font sizes
  superlargeTitle: 52,
  largeTitle: 44,
  mediumTitle: 38,
  h1: 30,
  h2: 22,
  h3: 16,
  h4: 14,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
};

export const FONTS = {
  main: { fontFamily: "Nunito" },
  // superlargeTitle: {
  //   fontFamily: "Roboto-Black",
  //   fontSize: SIZES.superlargeTitle,
  //   lineHeight: 55,
  // },
  // largeTitle: {
  //   fontFamily: "Roboto-Black",
  //   fontSize: SIZES.largeTitle,
  //   lineHeight: 55,
  // },
  // mediumTitle: {
  //   fontFamily: "Roboto-Black",
  //   fontSize: SIZES.mediumTitle,
  //   lineHeight: 55,
  // },
  // h1: { fontFamily: "Roboto-Black", fontSize: SIZES.h1, lineHeight: 50 },
  // h2: { fontFamily: "Roboto-Bold", fontSize: SIZES.h2, lineHeight: 30 },
  // h3: { fontFamily: "Roboto-Bold", fontSize: SIZES.h3, lineHeight: 22 },
  // h4: { fontFamily: "Roboto-Regular", fontSize: SIZES.h4, lineHeight: 22 },
  // body1: {
  //   fontFamily: "Roboto-Regular",
  //   fontSize: SIZES.body1,
  //   lineHeight: 36,
  // },
  // body2: {
  //   fontFamily: "Roboto-Regular",
  //   fontSize: SIZES.body2,
  //   lineHeight: 30,
  // },
  // body3: {
  //   fontFamily: "Roboto-Regular",
  //   fontSize: SIZES.body3,
  //   lineHeight: 22,
  // },
  // body4: {
  //   fontFamily: "Roboto-Regular",
  //   fontSize: SIZES.body4,
  //   lineHeight: 22,
  // },
  // image: {
  //   // flex: 1,
  //   width: 98,
  //   height: 98,
  //   borderRadius: 20,
  //   borderWidth: 0.4,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
};

export const RWD = {
  /**
   * @param {number} width px unit in Figma
   * @return {String}      calc(100vw * ${width} / 1920)
   */
  RWDWidth: (width) => `calc(100vw * ${width} / 1920)`,
  /**
   * @param {number} height px unit in Figma
   * @return {String}       calc(100vh * ${height} / 1080)
   */
  RWDHeight: (height) => `calc(100vh * ${height} / 1080)`,
  /**
   * @param {number} radius px unit in Figma
   * @return {String}       calc(100vmin * ${radius} / 1080)
   */
  RWDRadius: (radius) => `calc(100vmin * ${radius} / 1080)`,
  /**
   * @param {number} fontsize px unit in Figma
   * @return {String}         calc(100vmin * ${fontsize} / 1080)
   */
  RWDFontSize: (fontsize) => `calc(100vmin * ${fontsize} / 1080)`,
  /**
   * @param {number} number px unit in Figma
   * @return {String}         calc(100vmin * ${number} / 1080)
   */
  RWDVmin: (number) => `calc(100vmin * ${number} / 1080)`,
};

export const ANIME = {
  FadeIn: css`
    animation-name: ${keyframes`
        from { opacity: 0; }
        to { opacity: 1; }
      `};
    animation-duration: 0.5s;
    animation-iteration-count: 1;
    animation-timing-function: linear;
  `,
  Rotate: css`
    animation-name: ${keyframes`
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    `};
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  `,
};

export default {
  COLORS,
  SIZES,
  FONTS,
  RWD,
  ANIME,
};
