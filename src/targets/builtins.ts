export const nodeFrozenBuiltins = [
	// ECMAScript builtins
	'Object', 'Function', 'Boolean', 'Symbol', 'Error', 'RangeError', 'ReferenceError',
	'SyntaxError', 'TypeError', 'URIError', 'Number', 'BigInt', 'Math', 'Date', 'String',
	'RegExp', 'Array', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Reflect', 'JSON', 'Intl',
	// Typed arrays
	'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray',
	'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array',
	'BigInt64Array', 'BigUint64Array',
	// Node & environment globals
	'global', // will map to global object
	'Buffer', 'console', 'process', 'require', 'module', 'exports',
	'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate',
	// URL / networking
	'URL', 'URLSearchParams'
] as const;

export const jsFrozenBuiltins = [
	'Object', 'Function', 'Array', 'Number', 'String', 'Boolean', 'Symbol', 'Error', 'TypeError', 'RangeError',
	'Date', 'RegExp', 'Math', 'JSON', 'Promise', 'Reflect', 'Map', 'Set', 'WeakMap', 'WeakSet'
] as const;

export const browserFrozenBuiltins = [
	'Window', 'Document', 'HTMLDocument', 'Element', 'Node', 'NodeList', 'Event', 'EventTarget',
	'HTMLElement', 'HTMLDivElement', 'HTMLScriptElement', 'HTMLIFrameElement', 'MutationObserver',
	'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'TouchEvent', 'NodeIterator',
	'Range', 'Selection', 'FontFace', 'CSSStyleDeclaration',
	'XMLHttpRequest', 'FormData', 'URL', 'URLSearchParams', 'History', 'Location', 'Storage',
	'localStorage', 'sessionStorage', 'IndexedDB', 'Performance', 'navigator'
] as const;

export type BuiltinName =
	| typeof nodeFrozenBuiltins[number]
	| typeof jsFrozenBuiltins[number]
	| typeof browserFrozenBuiltins[number];

const buildLookup = (): Set<string> => {
	const s = new Set<string>();
	const add = (arr: readonly string[]): void => {
		for (const v of arr) {
			s.add(v);
			s.add(v.toLowerCase());
			// also add a lower-first variant (e.g. 'Document' -> 'document')
			if (v.length > 0) { s.add(v.charAt(0).toLowerCase() + v.slice(1)); }
		}
	};
	add(nodeFrozenBuiltins as readonly string[]);
	add(jsFrozenBuiltins as readonly string[]);
	add(browserFrozenBuiltins as readonly string[]);
	return s;
};

const ALLOWED_ROOTS = buildLookup();

export function isValidRoot (root: string): boolean {
	if (!root) { return false; }
	if (ALLOWED_ROOTS.has(root)) { return true; }
	// allow names that start with a builtin followed by a dot (e.g. 'global.Buffer')
	for (const candidate of ALLOWED_ROOTS) {
		if (root === candidate) { return true; }
		if (root.startsWith(candidate + '.')) { return true; }
	}
	return false;
}
