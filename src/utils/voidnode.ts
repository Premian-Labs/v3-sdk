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

export function transformToLegacyData<T>(root: T) {
	if (!root) return root
	if (Array.isArray(root)) {
		const newRoot = [] as NonNullable<T>

		for (let i = 0; i < root.length; i++) {
			newRoot[i as keyof typeof newRoot] = transformToLegacyData(root[i])
		}

		return newRoot
	}

	const newRoot = {} as NonNullable<T>

	for (let key of Object.keys(root as Object)) {
		const value = root[key as keyof typeof root]

		if (
			typeof value === 'string' &&
			isNumeric(value) &&
			(value as string).includes('.')
		) {
			const decimal = new Decimal(value)
			newRoot[key as keyof typeof newRoot] = parseBigDecimal(
				decimal
			) as NonNullable<T>[keyof NonNullable<T>]
		} else if (Array.isArray(value)) {
			newRoot[key as keyof typeof newRoot] = value.map((el) =>
				transformToLegacyData(el)
			) as NonNullable<T>[keyof NonNullable<T>]
		} else if (typeof value === 'object') {
			newRoot[key as keyof typeof newRoot] = transformToLegacyData(value)
		} else {
			newRoot[key as keyof typeof newRoot] = value
		}

		if (key === 'id') {
			newRoot['id' as keyof typeof newRoot] =
				newRoot[key as keyof typeof newRoot]
		}
	}

	return newRoot
}
