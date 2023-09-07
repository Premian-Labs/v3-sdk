import {
	Addresses,
	OrderbookV1,
	PoolKey,
	Signature,
	SupportedChainId,
	Domain,
	QuoteOBMessage,
	QuoteOB,
	OrderbookQuote,
	WSFilterMessage,
	WSRFQRequest,
	QuoteSaltOptionalT,
	QuoteWithSignature,
	signData
} from '../../src'
import PoolFactoryABI from '../../src/abi/PoolFactory.json'
import PoolTradeABI from '../../src/abi/IPool.json'
import ERC20MockABI from '../../src/abi/ERC20Mock.json'
import { expect } from 'chai'
import {
	Contract,
	JsonRpcProvider,
	parseEther,
	toBigInt,
	Wallet,
	ZeroAddress,
} from 'ethers'
import moment from 'moment'
import Ajv from 'ajv'
import { omit } from 'lodash'
import * as Dotenv from 'dotenv'

// TODO: update tests to use Arb Goerli Orderbook contract (not NOVA)
Dotenv.config()
const {
	API_KEY_INFURA,
	TESTNET_PRIVATE_KEY,
	PRIVATE_KEY_NOVA,
	TEST_API_KEY,
} = process.env

if (
	!API_KEY_INFURA ||
	!TESTNET_PRIVATE_KEY ||
	!PRIVATE_KEY_NOVA ||
	!TEST_API_KEY
) {
	throw new Error(`Missing e2e credentials`)
}

const ajv = new Ajv()

/**
 *  ValidatePostQuotes MUST match the AJV schema on the cloud.  If the Cloud Schema changes
 *  this schema must change (or vice versa)
 */
const validatePostQuotes = ajv.compile({
	type: 'array',
	items: {
		type: 'object',
		properties: {
			poolKey: {
				type: 'object',
				properties: {
					base: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
					quote: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
					oracleAdapter: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
					strike: { type: 'string' },
					maturity: { type: 'integer' },
					isCallPool: { type: 'boolean' },
				},
				required: [
					'base',
					'quote',
					'oracleAdapter',
					'strike',
					'maturity',
					'isCallPool',
				],
				additionalProperties: false,
			},
			chainId: {
				type: 'string',
				pattern: '^42161$|^421613$',
			},
			provider: { type: 'string', pattern: '^0x[a-f0-9]{40}$' },
			taker: { type: 'string', pattern: '^0x[a-f0-9]{40}$' },
			price: { type: 'string' }, // serialized bigint representation
			size: { type: 'string' }, // serialized bigint representation
			isBuy: { type: 'boolean' },
			deadline: { type: 'integer' },
			salt: { type: 'integer' },
			signature: {
				type: 'object',
				properties: {
					r: { type: 'string' },
					s: { type: 'string' },
					v: { type: 'integer' },
				},
				required: ['r', 's', 'v'],
				additionalProperties: false,
			},
		},
		required: [
			'poolKey',
			'chainId',
			'provider',
			'taker',
			'price',
			'size',
			'isBuy',
			'deadline',
			'salt',
			'signature',
		],
		additionalProperties: false,
	},
	minItems: 1,
	maxItems: 1000,
})

const strike = 1800
const maturity = moment()
	.utcOffset(0)
	.add(7, 'd')
	.day(5)
	.set({ hour: 8, minute: 0, second: 0, millisecond: 0 })

const maturitySec = maturity.valueOf() / 1000

const EIP712Domain = [
	{ name: 'name', type: 'string' },
	{ name: 'version', type: 'string' },
	{ name: 'chainId', type: 'uint256' },
	{ name: 'verifyingContract', type: 'address' },
]

const CHAIN_ID = SupportedChainId.ARBITRUM_GOERLI
const provider = new JsonRpcProvider(
	`https://arbitrum-goerli.infura.io/v3/${process.env.API_KEY_INFURA}`
)
const poolFactoryAddress: string =
	Addresses[SupportedChainId.ARBITRUM_GOERLI].POOL_FACTORY
const baseAddress: string =
	Addresses[SupportedChainId.ARBITRUM_GOERLI].TEST_WETH
const quoteAddress: string = Addresses[SupportedChainId.ARBITRUM_GOERLI].USDC
const oracleAdapter: string =
	Addresses[SupportedChainId.ARBITRUM_GOERLI].CHAINLINK_ORACLE_ADAPTER
const routerAddress: string = Addresses[SupportedChainId.ARBITRUM_GOERLI].ERC20_ROUTER
const deployer = new Wallet(TESTNET_PRIVATE_KEY, provider)


/**
 * !!!IMPORTANT!!!
 * Cloud services must be running to run this test.
 * GOTCHA: Tests should NOT be run within THREE MINUTES of each other (to let orders expire from redis)
 * REQUIRED: Please ensure DEPLOYER has proper funds available to execute testnet transactions
 * Double check that the API Key is valid
 */
const orderbook = new OrderbookV1(
	'https://test.orderbook.premia.finance',
	'wss://test.quotes.premia.finance',
	TEST_API_KEY,
	CHAIN_ID
)

const poolKey: PoolKey = {
	base: baseAddress,
	quote: quoteAddress,
	oracleAdapter: oracleAdapter,
	strike: parseEther(strike.toString()),
	maturity: maturitySec,
	isCallPool: true,
}

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTsSorted(arr: OrderbookQuote[]) {
	return arr.every(function (x, i) {
		return i === 0 || x.ts <= arr[i - 1].ts
	})
}

async function deployPool(): Promise<string> {
	const poolFactory = new Contract(poolFactoryAddress, PoolFactoryABI, deployer)
	let [_poolAddress, isDeployed] = await poolFactory.getPoolAddress(poolKey)
	if (isDeployed) {
		console.log('Pool already exists!')
		console.log('poolAddress:', _poolAddress)
		return _poolAddress
	} else {
		const deploymentTx = await poolFactory.deployPool(poolKey, {
			value: parseEther('1'), //init fee. excess refunded
			gasLimit: 10000000, // Fails to properly estimate gas limit
		})

		await provider.waitForTransaction(deploymentTx.hash, 1)
		;[_poolAddress] = await poolFactory.getPoolAddress(poolKey)
		console.log('Pool newly deployed!')
		console.log('poolAddress:', _poolAddress)
		return _poolAddress
	}
}

//NOTE: only for call option type
async function fillQuote(quote: OrderbookQuote, fillSize: bigint){

	const pool = new Contract(poolAddress, PoolTradeABI, deployer)
	const erc20 = new Contract(baseAddress, ERC20MockABI, deployer);
	await erc20.approve(routerAddress, fillSize.toString());

	const quoteOB: QuoteOB = {
		provider: quote.provider,
		taker:  quote.taker,
		price: toBigInt(quote.price),
		size: toBigInt(quote.size),
		isBuy: quote.isBuy,
		deadline: toBigInt(quote.deadline),
		salt: toBigInt(quote.salt)
	}

	const signedQuote = {
		...quoteOB,
		r: quote.signature.r,
		s: quote.signature.s,
		v: quote.signature.v
	}

	const fillQuoteTx = await pool.fillQuoteOB(
		quoteOB,
		fillSize,
		signedQuote,
		ZeroAddress,
		{
			gasLimit: 10000000,
		}
	);
	console.log("order sent")

	const receipt = await provider.waitForTransaction(fillQuoteTx.hash, 1);
	receipt?.status == 1? console.log("Fill Trans Successful") : console.log("WARNING: Fill Trans Reverted")
}

async function cancelQuote(quoteHash: string){
	const pool = new Contract(poolAddress, PoolTradeABI, deployer)
	const cancelQuoteTx = await pool.cancelQuotesOB(
		[quoteHash],
		{
			gasLimit: 10000000,
		}
	)
	const receipt = await provider.waitForTransaction(cancelQuoteTx.hash, 1);
	receipt?.status == 1? console.log("Cancel Trans Successful") : console.log("WARNING: Cancel Trans Reverted")
}

async function createQuoteWithSignature(
	poolAddress: string,
	price = '0.1',
	isBuy: boolean = false,
	takerAddress = ZeroAddress,
	provider = deployer.address,
	ts = Math.trunc(new Date().getTime() / 1000),
	THREE_MIN = 180
): Promise<QuoteWithSignature> {
	const quoteOB: QuoteOB = {
		provider: provider.toLowerCase(),
		taker: takerAddress.toLowerCase(),
		price: parseEther(price),
		size: parseEther('1'),
		isBuy: isBuy,
		deadline: toBigInt(ts + THREE_MIN),
		salt: toBigInt(ts),
	}

	const message: QuoteOBMessage = {
		...quoteOB,
		price: quoteOB.price.toString(),
		size: quoteOB.size.toString(),
		deadline: quoteOB.deadline.toString(),
		salt: quoteOB.salt.toString(),
	}

	const domain: Domain = {
		name: 'Premia',
		version: '1',
		chainId: CHAIN_ID.toString(),
		verifyingContract: poolAddress,
	}

	const typedData = {
		types: {
			EIP712Domain,
			FillQuoteOB: [
				{ name: 'provider', type: 'address' },
				{ name: 'taker', type: 'address' },
				{ name: 'price', type: 'uint256' },
				{ name: 'size', type: 'uint256' },
				{ name: 'isBuy', type: 'bool' },
				{ name: 'deadline', type: 'uint256' },
				{ name: 'salt', type: 'uint256' },
			],
		},
		primaryType: 'FillQuoteOB',
		domain,
		message,
	}

	const sig: Signature = await signData(deployer, deployer.address, typedData)

	return {
		poolKey: poolKey,
		...quoteOB,
		signature: sig,
		chainId: CHAIN_ID.toString(),
	}
}

let poolAddress: string
let publicQuoteWithSignature: QuoteWithSignature
let publishedQuote: OrderbookQuote
describe('OrderbookV1', () => {
	before(async () => {
		// check that a pool exists or deploy if it does not
		poolAddress = await deployPool()
		poolAddress = poolAddress.toLowerCase()
		publicQuoteWithSignature = await createQuoteWithSignature(poolAddress)
	})

	it('should properly initialize orderbook', () => {
		expect(orderbook.uri).to.eq('https://test.orderbook.premia.finance')
		expect(orderbook.wsUri).to.eq('wss://test.quotes.premia.finance')
		expect(orderbook.apiKey).to.eq(TEST_API_KEY)
	})

	/**
	 * All quotes published to cloud or nova require a signature
	 * IMPORTANT: This does NOT have any direct use case within the orderbook or to POST/GET quotes
	 * as it is not compatible with any cloud schema
	 */
	it('should properly serialize a quote', () => {
		const obQuote = omit(publicQuoteWithSignature, [
			'signature',
			'chainId',
		]) as QuoteSaltOptionalT
		const serializedOBQuote = orderbook.serializeQuote(obQuote)
		expect(typeof serializedOBQuote.poolKey.strike).to.eq('string')
		expect(typeof serializedOBQuote.poolKey.maturity).to.eq('number')
		expect(typeof serializedOBQuote.price).to.eq('string')
		expect(typeof serializedOBQuote.size).to.eq('string')
		expect(typeof serializedOBQuote.deadline).to.eq('number')
		expect(typeof serializedOBQuote.salt).to.eq('number')
	})

	/**
	 * IMPORTANT: This is the process to produce final quote object that is compatible with the
	 * cloud schema
	 */
	it('should properly serialize a quote with signature', async () => {
		const serializedQuoteWithSig = orderbook.serializeQuotesWithSignature([
			publicQuoteWithSignature,
		])
		const valid = validatePostQuotes(serializedQuoteWithSig)
		expect(valid).to.be.true
	})

	/**
	 * quoteId is just the quote hash. Calculating the quote hash output is not tested here
	 */
	it('should publish a public quote and receive quoteId, poolAddress & chainId along with quote', async () => {
		publishedQuote = (await orderbook.publishQuotes([publicQuoteWithSignature])).created[0]
		expect(publishedQuote).to.include.all.keys('quoteId', 'poolAddress', 'chainId', 'fillableSize','ts')
		expect(publishedQuote.poolAddress).to.eq(poolAddress)
	})

	/**
	 * transactions will come back preOrdered from best -> worst pricing
	 */
	it('Should get public quotes from redis', async () => {
		const quotes = await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask'
		)

		// ensure fillableSize is accurate
		const filledQuotes = quotes.filter(quote => quote.size !== quote.fillableSize).length

		expect(quotes.length).to.be.eq(1)
		expect(
			quotes.some((quote) => quote.quoteId === publishedQuote.quoteId)
		).to.eq(true)
		expect(filledQuotes).to.eq(0)
	})

	it ("should properly update fillableSize on a partial fill on-chain", async() => {
		const quote = (await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask'
		))[0]

		const fillSize = parseEther('.1')
		await fillQuote(quote, fillSize)

		await delay(10000)
		const updatedQuote = (await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask'
		))[0]

		expect(quote.fillableSize).to.eq(parseEther('1').toString())
		expect(updatedQuote.fillableSize).to.eq((parseEther('1') - fillSize).toString())
	})

	it ('should properly remove an order from redis when completely filled on-chain', async() => {
		const quote = (await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask'
		))[0]

		const fillSize = parseEther('.9')
		await fillQuote(quote, fillSize)

		await delay(10000)
		const updatedQuote = (await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask'
		))[0]

		expect(updatedQuote).to.equal(undefined)
	})

	it ('should properly remove an order from redis when cancelled on-chain', async() => {
		publishedQuote = (await orderbook.publishQuotes([publicQuoteWithSignature])).created[0]
		const quoteId = publishedQuote.quoteId
		expect(publishedQuote).to.include.all.keys('quoteId', 'poolAddress', 'chainId')
		expect(publishedQuote.poolAddress).to.eq(poolAddress)
		await delay(10000)

		const quotes = (await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask'
		))

		expect(quotes.length).to.be.eq(1)

		await cancelQuote(quoteId)
 		await delay(10000)
		const updatedQuotes = (await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask'
		))

		expect(updatedQuotes.length).to.be.eq(0)
	})

	// NOTE: This will keep TWO orders on the orderbook
	it('Should get public quotes from redis filtered by provider', async () => {
		publishedQuote = (await orderbook.publishQuotes([publicQuoteWithSignature])).created[0]
		const quoteProvider = '0xd18EE1c241e7A7e59797763C94d2Bd8C9169c831'
		const quoteWithSignature = await createQuoteWithSignature(poolAddress,'0.6', false, ZeroAddress, quoteProvider)

		await orderbook.publishQuotes([quoteWithSignature])

		// we should have two identical quote with except the provider address
		const quotesProvider = await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask',
			quoteProvider
		)

		const quotes = await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask'
		)

		expect(quotesProvider.length).to.eq(1)
		expect(quotesProvider[0].provider).to.eq(quoteProvider.toLowerCase())
		expect(quotes.length).to.eq(2)
	})

	// NOTE: combined with the orders from above, this will have a total of THREE orders
	it ('Should get public and rfq quotes together', async() => {
		const takerAddress = '0xd18EE1c241e7A7e59797763C94d2Bd8C9169c799'
		const quoteWithSignature = await createQuoteWithSignature(poolAddress,'0.5', false, takerAddress)
		await orderbook.publishQuotes([quoteWithSignature])

		const quotes = await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask',
			undefined,
			takerAddress
		)
		expect(quotes.length).to.eq(3)
		expect(quotes[0].taker).to.eq(ZeroAddress.toLowerCase())
		expect(quotes[1].taker).to.eq(takerAddress.toLowerCase())
		expect(quotes[2].taker).to.eq(ZeroAddress.toLowerCase())

	})

	it('should return properly sorted public quotes (ordered by price then timestamp)', async() => {
		// Note: order in the before() hook has a BETTER price
		const order3 = await createQuoteWithSignature(poolAddress, '0.2')
		const publishedOrder1 = (await orderbook.publishQuotes([order3])).created[0]
		// delay affects public quotes ordering
		await delay(10000)

		const order4 = await createQuoteWithSignature(poolAddress, '0.2')
		const publishedOrder2 = (await orderbook.publishQuotes([order4])).created[0]

		// get quotes
		const quotes = await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask'
		)

		// best quote
		expect(quotes[0].quoteId).to.eq(publishedQuote.quoteId)
		// tiebreaker goes to order 1
		expect(quotes[1].quoteId).to.eq(publishedOrder1.quoteId)
		// last order due to FIFO timestamp
		expect(quotes[2].quoteId).to.eq(publishedOrder2.quoteId)
	})

	it('should return all public quotes for a given market sorted by ts', async () => {
		const order5 = await createQuoteWithSignature(poolAddress, '0.15', true)
		await orderbook.publishQuotes([order5])

		await delay(10000)
		const order6 = await createQuoteWithSignature(poolAddress, '0.10', true)
		await orderbook.publishQuotes([order6])

		// get all quotes
		const orders = await orderbook.getOrders(poolAddress)

		expect(orders.length).to.eq(6)
		expect(isTsSorted(orders)).to.eq(true)
	})

	it('should properly prevent duplication of orders', async () => {
		const mockSalt = Math.trunc(new Date().getTime() / 1000)
		// Having the same salt (which is derived from timestamp) will ensure the specs of the order are identical
		const order1 = await createQuoteWithSignature(
			poolAddress,
			'0.3',
			false,
			ZeroAddress,
			deployer.address,
			mockSalt
		)
		const publishedOrder1 = (await orderbook.publishQuotes([order1])).created[0]

		const dupeOrder1 = await createQuoteWithSignature(
			poolAddress,
			'0.3',
			false,
			ZeroAddress,
			deployer.address,
			mockSalt
		)
		const publishedDupeOrder1 = (await orderbook.publishQuotes([dupeOrder1]))

		const quotes = await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask'
		)
		// find how many quotes match the quoteId
		const orderOccurances = quotes.filter(
			(quote) => quote.quoteId == publishedOrder1.quoteId
		).length

		// expect initial order to return order object with quoteId and poolAddress
		expect(publishedOrder1).to.include.all.keys('quoteId', 'poolAddress')
		// expect duplicate order to return 'created':[]
		expect(publishedDupeOrder1.created).to.be.lengthOf(0)
		// expect duplicate order to be the same as original order
		expect(publishedDupeOrder1.exists[0]).to.be.eq(omit(publishedOrder1, ['ts', 'fillableSize']))
		// ensure order is only placed once
		expect(orderOccurances).to.eq(1)
	})

	/*
	 * NOTE: this test uses published quote from prior test (it will not run in isolation)
	 */
	it('should properly isolate public and private quotes when using api', async () => {
		const dummyTakerAddress =
			'0x3D1dcc44D65C08b39029cA8673D705D7e5c4cFF2'.toLowerCase()
		const rfqQuoteWithSignature = await createQuoteWithSignature(
			poolAddress,
			'0.4',
			false,
			dummyTakerAddress
		)
		const publishedPrivateQuote = (
			await orderbook.publishQuotes([rfqQuoteWithSignature])
		).created[0]

		// check that PRIVATE quote posted
		expect(publishedPrivateQuote).to.include.all.keys('quoteId', 'poolAddress')
		expect(publishedPrivateQuote.poolAddress).to.eq(poolAddress)

		// get all available PUBLIC sell (ask) quotes
		// NOTE: 'publishedQuote' from previous test should show up here
		const quotes = await orderbook.getQuotes(
			poolAddress,
			parseEther('100').toString(),
			'ask'
		)

		// check that the public quote is still being received
		expect(
			quotes.some((quote) => quote.quoteId === publishedQuote.quoteId)
		).to.eq(true)
		// make sure PRIVATE quote does not show up from a PUBLIC quote query
		expect(
			quotes.some((quote) => quote.quoteId === publishedPrivateQuote.quoteId)
		).to.eq(false)
	})

	// NOTE: this test uses the rfq quote posted in previous test
	it('should properly retrieve an rfq quote when using api', async () => {
		const dummyTakerAddress =
			'0x3D1dcc44D65C08b39029cA8673D705D7e5c4cFF2'.toLowerCase()
		const rfqQuoteWithSignature = await createQuoteWithSignature(
			poolAddress,
			'0.5',
			false,
			dummyTakerAddress
		)
		const publishedPrivateQuote = (
			await orderbook.publishQuotes([rfqQuoteWithSignature])
		).created[0]

		const rfqQuotes = await orderbook.getRfqQuotes(
			poolAddress,
			'ask',
			dummyTakerAddress
		)
		expect(
			rfqQuotes.some((quote) => quote.quoteId === publishedPrivateQuote.quoteId)
		).to.eq(true)
	})

	it('should connect to ws', async () => {
		let infoMessage = ''
		await orderbook.connect((message) => {
			switch (message.type) {
				case 'INFO': {
					infoMessage = message.message
					break
				}
				default: {
					throw `Wrong message type ${message.type}`
				}
			}
		})
		await delay(2000)
		const isConnected = orderbook.isConnected()
		expect(isConnected).to.be.true
		expect(infoMessage).to.eq(`Session authorized. Subscriptions enabled.`)
	})

	it('should prevent unauthorized access', async () => {
		let connectionMessage: string = ''
		let subscriptionMessage: string = ''

		const properApiKey = orderbook.apiKey
		orderbook.apiKey = 'dummyapikey'
		await orderbook.connect((message) => {
			switch (message.type) {
				case 'ERROR': {
					connectionMessage = message.message
					break
				}
				default: {
					throw `Wrong message type ${message.type}`
				}
			}
		})
		await delay(2000)

		const webSocketFilter: WSFilterMessage = {
			type: 'FILTER',
			channel: 'QUOTES',
			body: {
				chainId: '421613',
				taker: deployer.address.toLowerCase(),
			},
		}

		await orderbook.subscribe(webSocketFilter, (message) => {
			switch (message.type) {
				case 'ERROR': {
					subscriptionMessage = message.message
					break
				}
				default: {
					throw `Wrong message type ${message.type}`
				}
			}
		})

		await delay(2000)
		orderbook.apiKey = properApiKey
		expect(connectionMessage).to.eq(`Invalid API key`)
		expect(subscriptionMessage).to.eq(`Not Authorized`)
	})

	it('should disconnect from ws', async () => {
		// ensure we have a connection to disconnect from
		const isConnected = orderbook.isConnected()
		expect(isConnected).to.be.true

		orderbook.disconnect()
		await delay(2000)
		const isDisconnected = orderbook.isDisconnected()
		expect(isDisconnected).to.be.true
	})

	/*
	 * Single connection to WS remains live for all tests from this point onward
	 */
	it('should request quote and receive a private quote & public quote via ws', async () => {
		let quotesReceived: OrderbookQuote[] = []
		let infoMessage: string[] = []

		await orderbook.connect((message) => {
			switch (message.type) {
				case 'INFO': {
					infoMessage.push(message.message)
					break
				}
				default: {
					throw `Wrong message type ${message.type}`
				}
			}
		})

		await delay(2000)
		expect(infoMessage[0]).to.eq(`Session authorized. Subscriptions enabled.`)

		// listen to public quotes AND private quotes (since we provide takerAddress)
		const webSocketFilter: WSFilterMessage = {
			type: 'FILTER',
			channel: 'QUOTES',
			body: {
				chainId: '421613',
				taker: deployer.address.toLowerCase(),
			},
		}

		await orderbook.subscribe(webSocketFilter, (message) => {
			switch (message.type) {
				case 'POST_QUOTE': {
					// add quote received to our array
					quotesReceived.push(message.body)
					break
				}
				case 'INFO': {
					infoMessage.push(message.message)
					break
				}
				default: {
					throw `Wrong message type ${message.type}`
				}
			}
		})
		await delay(2000)
		expect(infoMessage[1]).to.eq(
			`Subscribed to quotes:${webSocketFilter.body.chainId}:*:*:${ZeroAddress},quotes:${webSocketFilter.body.chainId}:*:*:${webSocketFilter.body.taker} channel.`
		)

		const rfqRequest: WSRFQRequest = {
			type: 'RFQ',
			body: {
				poolAddress: poolAddress,
				side: 'ask',
				chainId: CHAIN_ID.toString(),
				size: parseEther('1').toString(),
				taker: deployer.address.toLowerCase(),
			},
		}

		const RFQChannelKey = `rfq:${rfqRequest.body.chainId}:${rfqRequest.body.poolAddress}:${rfqRequest.body.side}:${rfqRequest.body.taker}`

		// request a quote
		await orderbook.publishRFQ(rfqRequest)
		await delay(2000)

		// receive private quote
		const rfqQuoteWithSignature = await createQuoteWithSignature(
			poolAddress,
			'0.4',
			false,
			deployer.address
		)
		const publishedPrivateQuote = (
			await orderbook.publishQuotes([rfqQuoteWithSignature])
		).created[0]
		await delay(10000)

		// receive generic quote
		const publicQuoteWithSignature = await createQuoteWithSignature(poolAddress)
		const publishedPublicQuote = (
			await orderbook.publishQuotes([publicQuoteWithSignature])
		).created[0]
		await delay(10000)

		const publicOrderOccurances = quotesReceived.filter(
			(quote) => quote.quoteId == publishedPrivateQuote.quoteId
		).length
		const privateOrderOccurances = quotesReceived.filter(
			(quote) => quote.quoteId == publishedPublicQuote.quoteId
		).length

		expect(quotesReceived.length).to.eq(2)
		expect(publicOrderOccurances).to.eq(1)
		expect(privateOrderOccurances).to.eq(1)
		expect(infoMessage[2]).to.eq(
			`Published RFQ to ${RFQChannelKey} Redis channel`
		)
	})

	it('should be able to unsubscribe from Quotes stream ws', async () => {
		let infoMessage: string = ''
		orderbook.unsubscribe('QUOTES', (message) => {
			switch (message.type) {
				case 'INFO': {
					infoMessage = message.message
					break
				}
				default: {
					throw `Wrong message type ${message.type}`
				}
			}
		})

		await delay(2000)
		expect(infoMessage).to.eq('Unsubscribed from QUOTES channel')
	})

	it('should be able to publish and receive rfq stream via ws', async () => {
		let subCases: string[] = []
		let infoMessage: string[] = []
		// params to listen to rfq requests
		const webSocketFilter: WSFilterMessage = {
			type: 'FILTER',
			channel: 'RFQ',
			body: {
				chainId: '421613',
			},
		}
		// params to broadcast rfq request
		const rfqRequest: WSRFQRequest = {
			type: 'RFQ',
			body: {
				poolAddress: poolAddress,
				side: 'bid',
				chainId: CHAIN_ID.toString(),
				size: '1000000000000000',
				taker: deployer.address.toLowerCase(),
			},
		}

		await orderbook.subscribe(webSocketFilter, (message) => {
			switch (message.type) {
				case 'RFQ': {
					// expect to receive broadcast rfq request
					expect(message).deep.eq(rfqRequest)
					subCases.push('RFQ')
					break
				}
				case 'INFO': {
					// first INFO message will be confirmation of RFQ subscription
					// second INFO message will be confirmation of PUBLISHING RFQ message
					infoMessage.push(message.message)
					subCases.push('PUBLISHED')
					break
				}
				default: {
					throw `Wrong message type ${message.type}`
				}
			}
		})

		await delay(2000)
		await orderbook.publishRFQ(rfqRequest)
		await delay(2000)

		expect(subCases.includes('PUBLISHED')).to.be.true
		expect(subCases.includes('RFQ')).to.be.true

		expect(infoMessage[0]).eq('Subscribed to rfq:421613:*:*:* channel.')
		const RFQChannelKey = `rfq:${rfqRequest.body.chainId}:${rfqRequest.body.poolAddress}:${rfqRequest.body.side}:${rfqRequest.body.taker}`
		expect(infoMessage[1]).eq(`Published RFQ to ${RFQChannelKey} Redis channel`)
		orderbook.disconnect()
	})
})
