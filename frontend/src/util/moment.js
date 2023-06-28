import Moment from "moment";
import "moment/locale/zh-tw";
import { extendMoment } from "moment-range";
const moment = extendMoment(Moment);

export default (language) => (time, format) =>
  moment(time, format).locale(language);

export { moment };
