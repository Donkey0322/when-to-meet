export default (id) => {
  let hour = String(parseInt(((id - 1) * 30) / 60));
  const startHour = "0".repeat(2 - hour.length) + hour;
  const startMinute = parseInt(((id - 1) * 30) % 60) ? "30" : "00";
  return `${startHour}:${startMinute}`;
};
