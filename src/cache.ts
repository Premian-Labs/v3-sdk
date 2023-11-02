import localforage from 'localforage'
import * as memoryDriver from 'localforage-driver-memory'

declare global {
	interface BigInt {
		toJSON(): string
	}
}

BigInt.prototype.toJSON = function () {
	return this.toString()
}

interface CacheData {
	data: string
	isJson: boolean
	expiration: number
}

export class Cache {
	public disabled: boolean = false
	public cache: LocalForage

	constructor(name: string) {
		localforage.defineDriver(memoryDriver)
		this.cache = localforage.createInstance({
			name,
			driver: [
				localforage.LOCALSTORAGE,
				localforage.INDEXEDDB,
				localforage.WEBSQL,
				memoryDriver._driver,
			],
		})
	}

	disable() {
		this.disabled = true
	}

	async get(key: string) {
		const cacheItem = await this.cache.getItem(key)
		const cacheData =
			typeof cacheItem === 'string' ? JSON.parse(cacheItem as string) : null

		if (cacheData) {
			if (cacheData.expiration < new Date().getTime()) {
				await this.remove(key)
				return null
			}

			return cacheData.isJson ? JSON.parse(cacheData.data) : cacheData.data
		}

		return null
	}

	async set(key: string, value: any, ttl: number = 0) {
		const isJson = value instanceof String ? false : true
		const data = isJson ? JSON.stringify(value) : value

		if (ttl === 0) {
			ttl = 60 * 60 * 24 * 365 * 10 // 10 years
		}

		const cacheData: CacheData = {
			data,
			isJson,
			expiration: new Date().getTime() + ttl * 1000,
		}

		if (cacheData.expiration < new Date().getTime()) {
			throw new Error('Cache expiration must be greater than current time')
		}

		return this.cache.setItem(key, JSON.stringify(cacheData))
	}

	async remove(key: string) {
		return this.cache.removeItem(key)
	}

	async clear() {
		return this.cache.clear()
	}
}

export const cache = new Cache('@premia/v3-sdk')

export function withCache(ttl: number = 0, _cache: Cache = cache) {
	return function (
		_: any,
		_methodName: string,
		descriptor: PropertyDescriptor
	) {
		const originalMethod = descriptor.value
		return {
			...descriptor,
			value: async function (...args: any[]) {
				if (_cache.disabled) {
					return originalMethod.apply(this, args)
				}

				const key = `${this.constructor.name}.${_methodName}.${JSON.stringify(
					args
				)}`
				const cached = await _cache.get(key)

				if (cached) {
					return cached
				}

				const result = await originalMethod.apply(this, args)

				if (result) {
					await _cache.set(key, result, ttl)
				}

				return result
			},
		}
	}
}

export default cache
