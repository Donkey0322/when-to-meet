import X from "./X";
import XY from "./XY";
export default (type) => {
  if (
    !type ||
    !Array.isArray(type) ||
    type.filter((f) => f !== "x" && f !== "y").length > 0
  ) {
    throw new Error(
      `請定義 Vote 種類，以陣列形式傳入：\n${["x", "y"]}\ncurrent: ${type}`
    );
  }
  if (type.includes("x") && type.includes("y")) {
    return XY;
  } else if (type.includes("x")) {
    return X;
  }
};
