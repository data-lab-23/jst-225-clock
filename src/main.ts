import "./styles.css";

import { formatClock } from "./clock/clock";
import { resolveTimeZone } from "./time-zone/timeZone";
import { createClockView } from "./ui/clockView";

const app = document.querySelector<HTMLElement>("#app");

if (!app) throw new Error("Clock application root is missing");

const now = new Date();
const view = createClockView(app);

view.render(formatClock(now), resolveTimeZone(now));
