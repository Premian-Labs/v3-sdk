import { DocumentNode, gql } from '@apollo/client/core'

import { addFields } from '../../../../utils/subgraph'
import {
	PoolDayDataFragment,
	PoolDayOrderbookDataFragment,
	PoolHourDataFragment,
	VaultDayDataFragment,
} from '../fragments'
import PremiaSubgraph from '../../index'

export class AnalyticsQuery {
	@addFields
	static GetPoolDayData(
		subgraph: PremiaSubgraph,
		poolAddress: string,
		startTime = 0,
		first = 1000,
		skip = 0
	): DocumentNode {
		return gql`
      ${PoolDayDataFragment}

      query PoolDayData {
        poolDayDatas(
          where: { pool: "${poolAddress.toLowerCase()}", periodStart_gt: ${startTime} }
          first: ${first}
          skip: ${skip}
          orderBy: periodStart
          orderDirection: asc
        ) {
          ...PoolDayData
        }
      }
    `
	}

	@addFields
	static GetPoolHourData(
		subgraph: PremiaSubgraph,
		poolAddress: string,
		startTime = 0,
		first = 1000,
		skip = 0
	): DocumentNode {
		return gql`
      ${PoolHourDataFragment}

      query PoolHourData {
        poolHourDatas(
          where: { pool: "${poolAddress.toLowerCase()}", periodStart_gt: ${startTime} }
          first: ${first}
          skip: ${skip}
          orderBy: periodStart
          orderDirection: asc
        ) {
          ...PoolHourData
        }
      }
    `
	}

	@addFields
	static GetPoolsOrderbookData(
		subgraph: PremiaSubgraph,
		poolAddresses: string[],
		first = poolAddresses.length,
		skip = 0
	): DocumentNode {
		return gql`
      ${PoolDayOrderbookDataFragment}
    
      query OrderbookData {
        poolDayDatas(
          where: { pool_in: [${poolAddresses
						.map((address) => `"${address.toLowerCase()}"`)
						.toString()}] }
          first: ${first}
          skip: ${skip}
          orderBy: periodStart
          orderDirection: desc
        ) {
          ...PoolDayOrderbookData
        }
      }
    `
	}

	@addFields
	static GetVaultDayData(
		subgraph: PremiaSubgraph,
		vaultAddress: string,
		startTime = 0,
		first = 1000,
		skip = 0
	): DocumentNode {
		return gql`
      ${VaultDayDataFragment}

      query VaultDayData {
        vaultDayDatas(
          where: { vault: "${vaultAddress.toLowerCase()}", periodStart_gt: ${startTime} }
          first: ${first}
          skip: ${skip}
          orderBy: periodStart
          orderDirection: asc
        ) {
          ...VaultDayData
        }
      }
    `
	}
}
