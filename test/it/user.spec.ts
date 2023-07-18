import 'mock-local-storage'
import { expect } from 'chai'

import { Premia } from '../../src'

describe('User API', function (this: any) {
	let sdk: Premia

	const defaultUser = '0x9e600587b9035a8c1254e8256f4e588cc33b8467'

	this.timeout(30000)

	beforeEach(async () => {
		sdk = await Premia.initialize({ useTestnet: true, disableCache: false })
	})

	it('should load the user', async () => {
		const user = await sdk.users.getUser(defaultUser)
		expect(user).to.not.be.undefined
	})

	it('should load the user extended', async () => {
		const user = await sdk.users.getUserExtended(defaultUser)
		expect(user).to.not.be.undefined
	})

	it('should load the user portfolio', async () => {
		const portfolio = await sdk.users.getUserPortfolio(defaultUser)

		expect(portfolio).to.not.be.undefined
	})

	it('should load option positions for user', async () => {
		const owner = '0x034d95d43752da3941c29e66e1ba5d2938c323e9'
		let positions = await sdk.users.getOptionPositionsExtendedForUser(owner)

		expect(positions.length).to.be.greaterThan(0)

		positions = await sdk.users.getOptionPositionsExtendedForUser(owner, true)

		expect(positions.length).to.be.greaterThan(0)
	})

	it('should load liquidity positions for user', async () => {
		let positions = await sdk.users.getLiquidityPositionsExtendedForUser(
			defaultUser
		)

		expect(positions.length).to.be.greaterThan(0)
	})

	it('should load the user settings', async () => {
		//const settings = await sdk.users.getUserSettings(defaultUser)
		const settings = await sdk.users.getActionAuthorization(
			defaultUser,
			defaultUser
		)

		expect(settings).to.not.be.undefined
		expect(settings.actions.length).to.be.greaterThan(0)
		expect(settings.authorization.length).to.be.greaterThan(0)
	})
})
