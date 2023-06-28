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

export const RWD = {
  /**
   * @param {number} width px unit in Figma
   * @return {String}      calc(100vw * ${width} / 1920)
   */
  RWDWidth: (width) =>
    `max(calc(100vw * ${width} / 1920), calc(${
      document.querySelector("body").offsetWidth
    }px * ${width} / 1920))`,
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
    animation-duration: 2s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  `,
  Float: css`
    animation-name: ${keyframes`
      0% { transform: translate(0,  0px); }
      50% { transform: translate(0, -8px); }
      100% { transform: translate(0, -0px); }
    `};
    animation-duration: 2s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  `,
  SlideFromTop: css`
    animation-name: ${keyframes`
      from { transform: translate(0, -100px); }
      to { transform: translate(0,  0px); }
    `};
    animation-duration: 0.5s;
    animation-iteration-count: 1;
    animation-timing-function: ease-in-out;
  `,
  ChangeColor: (from = "#000000", to = "red") => css`
    animation-name: ${keyframes`
      0% { color: ${from}; }
      50% { color: ${to}; }
      100% { color: ${from}; }
    `};
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  `,
};

export const PAGE_TRANSITION = {
  RightSlideIn: {
    initial: { x: window.innerWidth * 2 },
    animate: { x: 0, transition: { duration: 0.15 } },
    exit: { x: window.innerWidth * 2 },
  },
  FadeIn: {
    initial: { opacity: 0, scale: 0.5 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.5,
        ease: [0, 0.71, 0.2, 1.01],
      },
    },
  },
};

export default {
  COLORS,
  RWD,
  ANIME,
  PAGE_TRANSITION,
};
