import {
	BigNumberish,
	BytesLike,
	randomBytes,
	Signer,
	toBigInt,
	TypedDataDomain,
	ZeroAddress,
} from 'ethers'
import { PermitTransferFrom, SignatureTransfer } from '@uniswap/permit2-sdk'

export const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

export interface PremiaPermit2 {
	deadline: BigNumberish
	nonce: BigNumberish
	permittedAmount: BigNumberish
	permittedToken: string
	signature: BytesLike
}

export function getRandomPermit2Nonce() {
	return ((toBigInt(randomBytes(32)) >> 8n) << 8n) + 1n
}

export async function signPermit2(signer: Signer, permit: PermitTransferFrom) {
	const chainId = (await signer.provider!.getNetwork()).chainId

	const { domain, types, values } = SignatureTransfer.getPermitData(
		permit,
		PERMIT2,
		Number(chainId)
	)

	return signer.signTypedData(domain as TypedDataDomain, types, values)
}

export async function signPremiaPermit2(
	signer: Signer,
	permit: PermitTransferFrom
): Promise<PremiaPermit2> {
	return {
		deadline: permit.deadline.toString(),
		nonce: permit.nonce.toString(),
		permittedAmount: permit.permitted.amount.toString(),
		permittedToken: permit.permitted.token,
		signature: await signPermit2(signer, permit),
	}
}

export function getEmptyPremiaPermit2(): PremiaPermit2 {
	return {
		permittedToken: ZeroAddress,
		permittedAmount: '0',
		nonce: '0',
		deadline: '0',
		signature: '0x',
	}
}
