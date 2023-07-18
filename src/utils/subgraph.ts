import { graphQlQueryToJson } from 'graphql-query-to-json'
import { jsonToGraphQLQuery } from 'json-to-graphql-query'
import { merge } from 'lodash'

import { PremiaConfig } from '../premia'
import { stringListToJson } from './json'
import PremiaSubgraph from '../services/subgraph'

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
			const subgraph = args[0] as PremiaSubgraph
			const query = descriptor.value.apply(this, args)
			if (!subgraph.queryParams?.additionalFields) {
				return query
			}
			return originalMethod.call(
				this,
				addFieldsToQuery(query, subgraph.queryParams.additionalFields)
			)
		},
	}
}
