import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export const FRIDAY = 5

export function nextYearOfMaturities(): dayjs.Dayjs[] {
	const maturities: dayjs.Dayjs[] = []
	const now = dayjs().utc()

	// Dailies
	let today = now.clone().startOf('day').hour(8)
	let tomorrow = today.clone().add(1, 'day')
	let twoDays = today.clone().add(2, 'day')

	// Weeklies
	let friday = now.clone().startOf('day').hour(8).day(FRIDAY)
	if (now.day() >= FRIDAY) {
		friday = friday.add(1, 'week')
	}
	const secondFriday = friday.clone().add(1, 'week')
	const thirdFriday = friday.clone().add(2, 'week')
	const fourthFriday = friday.clone().add(3, 'week')
	const fifthFriday = friday.clone().add(4, 'week')

	// Monthlies
	const currentMonth = now.month()
	const months = []
	for (let i = 1; i <= 12; ++i) {
		let monthly = now
			.clone()
			.month(currentMonth + i)
			.startOf('month')
			.hour(8)
			.day(FRIDAY)
		if (monthly.date() > 7) {
			monthly = monthly.subtract(1, 'week')
		}
		while (monthly.month() === currentMonth + i) {
			monthly = monthly.add(1, 'week')
		}
		monthly = monthly.subtract(1, 'week')
		months.push(monthly)
	}

	// Check and push to maturities
	if (today.isAfter(now)) {
		maturities.push(today)
	}
	if (tomorrow.isAfter(now)) {
		maturities.push(tomorrow)
	}
	maturities.push(twoDays)

	const fridays = [friday, secondFriday, thirdFriday, fourthFriday, fifthFriday]
	fridays.forEach((fri: dayjs.Dayjs) => {
		if (!maturities.find((maturity) => maturity.isSame(fri))) {
			maturities.push(fri)
		}
	})

	for (let monthly of months) {
		if (!maturities.find((maturity) => maturity.isSame(monthly))) {
			maturities.push(monthly)
		}
	}

	return maturities
}

export default dayjs
