export function isObjectLike (v: unknown): boolean {
	return (typeof v === 'object' && v !== null) || typeof v === 'function';
}
