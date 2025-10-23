// Simple 32-bit FNV-1a implementation and small chain/hash helpers
export function fnv1a32 (str: string): number {
	let h = 0x811c9dc5 >>> 0;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = (h * 0x01000193) >>> 0;
	}
	return h >>> 0;
}

export function combineHash (a: number, b: number): number {
	return ((a ^ b) * 16777619) >>> 0;
}

export function chainFromSeed (seed: number, merkleRoot: number): number {
	return combineHash(seed >>> 0, merkleRoot >>> 0);
}

export default { fnv1a32, combineHash, chainFromSeed };
