export default (id) => {
  let hour = String(parseInt(((id - 1) * 30) / 60));
  const FormattedHour = "0".repeat(2 - hour.length) + hour;
  if (FormattedHour === "24") {
    return "23:59";
  }
  const FormattedMinute = parseInt(((id - 1) * 30) % 60) ? "30" : "00";
  return `${FormattedHour}:${FormattedMinute}`;
};
