import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isoWeek from "dayjs/plugin/isoWeek";
import duration from "dayjs/plugin/duration";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isoWeek);
dayjs.extend(duration);

function isFriday(ts: Dayjs): boolean {
	return ts.day() === 5;
}

function isLastFriday(ts: Dayjs): boolean {
	const next = ts.add(7, "day");
	return isFriday(ts) && ts.month() !== next.month();
}

export function nextYearOfMaturities(): Dayjs[] {
	const maturities: Dayjs[] = [];
	const now = dayjs().utc();
	let maturity = now.clone().startOf("day").add(8, "hour");

	if (maturity.isSameOrBefore(now)) {
		maturity = maturity.add(1, "day");
	}

	while (maturity.diff(now, "day") < 365) {
		const ttm = dayjs.duration(maturity.diff(now));

		if (ttm.asDays() < 3) {
			maturities.push(maturity);
			maturity = maturity.add(1, "day");
		} else if (ttm.asDays() >= 3 && ttm.asDays() <= 35) {
			while (!isFriday(maturity)) {
				maturity = maturity.add(1, "day");
			}

			maturities.push(maturity);
			maturity = maturity.add(7, "day");
		} else {
			if (isLastFriday(maturity)) {
				maturities.push(maturity);
			}

			maturity = maturity.add(7, "day");
		}
	}

	return maturities;
}

export default dayjs
