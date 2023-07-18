import { TypedDataDomain } from 'ethers'

export interface Signature {
	r: string
	s: string
	v: number
}

export interface SignatureDomain extends TypedDataDomain {
	name: string
	version: string
	chainId: number
	verifyingContract: string
}

export const EIP712Domain = [
	{ name: 'name', type: 'string' },
	{ name: 'version', type: 'string' },
	{ name: 'chainId', type: 'uint256' },
	{ name: 'verifyingContract', type: 'address' },
]
