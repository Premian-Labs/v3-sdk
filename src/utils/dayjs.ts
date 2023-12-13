import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import weekOfYear from 'dayjs/plugin/weekOfYear'

dayjs.extend(utc)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(weekOfYear)

export const FRIDAY = 5

export function nextYearOfMaturities(): dayjs.Dayjs[] {
	const maturities = []

	const today = dayjs().utc().startOf('day')
	const nextYear = today.add(1, 'year')

	// if today is Fri and hour < 8:00 AM
	if (dayjs().utc().day() === FRIDAY && dayjs().utc().hour() < 8)
		maturities.push(today)

	const tomorrow = today.add(1, 'day').add(8, 'hours')
	const afterTomorrow = today.add(2, 'days').add(8, 'hours')

	let nextFriday = today.day(FRIDAY).add(8, 'hours')
	if (today.day() > FRIDAY) {
		nextFriday = nextFriday.add(1, 'week')
	}

	maturities.push(tomorrow, afterTomorrow)

	if (!nextFriday.isSame(today, 'day') && !nextFriday.isSame(tomorrow, 'day') && !nextFriday.isSame(afterTomorrow, 'd'))
		maturities.push(nextFriday)

	const next2ndFriday = nextFriday.add(1, 'week')
	const next3rdFriday = nextFriday.add(2, 'weeks')
	const next4thFriday = nextFriday.add(3, 'weeks')

	maturities.push(next2ndFriday)

	if (next3rdFriday.diff(today, 'day') < 30) maturities.push(next3rdFriday)
	if (next4thFriday.diff(today, 'day') < 30) maturities.push(next4thFriday)

	let increment = 1
	let monthlyPointer = today.startOf('month').add(increment, 'month')

	while (monthlyPointer.isBefore(nextYear, 'month')) {
		const lastDay = today
			.startOf('month')
			.add(increment, 'month')
			.endOf('month')
			.startOf('day')

		const lastFriday8AM = lastDay
			.subtract((lastDay.day() + 2) % 7, 'days')
			.add(8, 'hours')

		monthlyPointer = today.startOf('month').add(increment, 'month')

		increment++
		maturities.push(lastFriday8AM)
	}

	return maturities
}

export default dayjs
