import { DocumentNode, gql } from '@apollo/client/core'

import { addFields } from '../../../../utils/voidnode'
import {
	PoolDayDataFragment,
	PoolDayOrderbookDataFragment,
	PoolHourDataFragment,
	VaultDayDataFragment,
} from '../fragments'
import PremiaVoidnode from '../../index'

export class AnalyticsQuery {
	@addFields
	static GetPoolDayData(
		voidnode: PremiaVoidnode,
		poolAddress: string,
		startTime = 0,
		limit = 1000,
		skip = 0
	): DocumentNode {
		return gql`
      ${PoolDayDataFragment}

      query PoolDayData {
        poolDayDatas(
          where: { pool: "${poolAddress.toLowerCase()}", periodStart_gt: ${startTime} }
          limit: ${limit}
          skip: ${skip}
          orderBy: [{
            field: periodStart
            direction: ASC
          }]
        ) {
          ...PoolDayData
        }
      }
    `
	}

	@addFields
	static GetPoolHourData(
		voidnode: PremiaVoidnode,
		poolAddress: string,
		startTime = 0,
		limit = 1000,
		skip = 0
	): DocumentNode {
		return gql`
      ${PoolHourDataFragment}

      query PoolHourData {
        poolHourDatas(
          where: { pool: "${poolAddress.toLowerCase()}", periodStart_gt: ${startTime} }
          limit: ${limit}
          skip: ${skip}
          orderBy: [{
            field: periodStart
            direction: ASC
          }]
        ) {
          ...PoolHourData
        }
      }
    `
	}

	@addFields
	static GetPoolsOrderbookData(
		voidnode: PremiaVoidnode,
		poolAddresses: string[],
		limit = poolAddresses.length,
		skip = 0
	): DocumentNode {
		return gql`
      ${PoolDayOrderbookDataFragment}
    
      query OrderbookData {
        poolDayDatas(
          where: { pool_in: [${poolAddresses
						.map((address) => `"${address.toLowerCase()}"`)
						.toString()}] }
          limit: ${limit}
          skip: ${skip}
          orderBy: [{
            field: periodStart
            direction: ASC
          }]
        ) {
          ...PoolDayOrderbookData
        }
      }
    `
	}

	@addFields
	static GetVaultDayData(
		voidnode: PremiaVoidnode,
		vaultAddress: string,
		startTime = 0,
		limit = 1000,
		skip = 0
	): DocumentNode {
		return gql`
      ${VaultDayDataFragment}

      query VaultDayData {
        vaultDayDatas(
          where: { vault: "${vaultAddress.toLowerCase()}", periodStart_gt: ${startTime} }
          limit: ${limit}
          skip: ${skip}
          orderBy: [{
            field: periodStart
            direction: ASC
          }]
        ) {
          ...VaultDayData
        }
      }
    `
	}
}
