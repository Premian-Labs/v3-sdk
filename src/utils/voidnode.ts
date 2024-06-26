import { graphQlQueryToJson } from 'graphql-query-to-json'
import { jsonToGraphQLQuery } from 'json-to-graphql-query'
import { Decimal } from 'decimal.js'
import { merge } from 'lodash'

import { PremiaConfig } from '../premia'
import { stringListToJson } from './json'
import PremiaVoidnode from '../services/voidnode'
import { parseBigDecimal } from './parse'

export interface QueryParams extends PremiaConfig {
	additionalFields?: string[]
}

export function addFieldsToQuery(query: string, fields: string[]): string {
	const fieldsJson = stringListToJson(fields)
	const json = graphQlQueryToJson(query)
	const updatedJson = merge(json, { query: fieldsJson })
	return jsonToGraphQLQuery(updatedJson)
}

export function addFields(
	_target: any,
	_methodName: string,
	descriptor: PropertyDescriptor
) {
	const originalMethod = descriptor.value
	return {
		...descriptor,
		value: function (...args: any[]) {
			const voidnode = args[0] as PremiaVoidnode
			const query = descriptor.value.apply(this, args)
			if (!voidnode.queryParams?.additionalFields) {
				return query
			}
			return originalMethod.call(
				this,
				addFieldsToQuery(query, voidnode.queryParams.additionalFields)
			)
		},
	}
}

function isNumeric(str: string): boolean {
	return !isNaN(parseFloat(str))
}

export function convertAllBigDecimalToBigInt<T extends Object>(root: T) {
	const newRoot = {} as T

	for (let key of Object.keys(root)) {
		const value = root[key as keyof typeof root]

		if (
			typeof value === 'string' &&
			isNumeric(value) &&
			(value as string).includes('.')
		) {
			const decimal = new Decimal(value)
			newRoot[key as keyof typeof newRoot] = parseBigDecimal(
				decimal
			) as T[keyof T]
		} else if (typeof value === 'object') {
			newRoot[key as keyof typeof newRoot] = convertAllBigDecimalToBigInt(
				value as Object
			) as T[keyof T]
		} else {
			newRoot[key as keyof typeof newRoot] = value
		}
	}

	return newRoot
}
