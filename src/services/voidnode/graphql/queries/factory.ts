import { DocumentNode, gql } from '@apollo/client/core'

import { FactoryExtendedFragment, FactoryFragment } from '../fragments'
import { addFields } from '../../../../utils/voidnode'
import PremiaVoidnode from '../../index'

export class FactoryQuery {
	static factoryId(address: string): string {
		return address
	}

	@addFields
	static GetFactory(voidnode: PremiaVoidnode, address: string): DocumentNode {
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
		voidnode: PremiaVoidnode,
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
