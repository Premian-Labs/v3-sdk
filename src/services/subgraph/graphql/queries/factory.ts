import { DocumentNode, gql } from '@apollo/client/core'
import { FactoryExtendedFragment, FactoryFragment } from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'

export class FactoryQuery {
	static factoryId(address: string): string {
		return address
	}

	@addFields
	static GetFactory(subgraph: PremiaSubgraph, address: string): DocumentNode {
		return gql`
        ${FactoryFragment}

        {  
            factory(id: "${this.factoryId(address)}") {
                ...Factory
            }
        }
    `
	}

	@addFields
	static GetFactoryExtended(
		subgraph: PremiaSubgraph,
		address: string
	): DocumentNode {
		return gql`
        ${FactoryExtendedFragment}

        {
            
            factory(id: "${this.factoryId(address)}") {
                ...FactoryExtended
            }
        }
    `
	}
}
