import { jsFrozenBuiltins, nodeFrozenBuiltins, browserFrozenBuiltins } from '../targets/builtins';
import type { AnyObject, GlobalLike } from '../utils/types';
import { fnv1a32, combineHash } from './hash';

export type IntegrityNode = {
	name: string;
	crcLocal: number;
	children?: IntegrityNode[];
	crcNode?: number;
};

export type IntegrityTree = {
	nodes: IntegrityNode[];
	merkleRoot: number;
};

function funcMeta (value: unknown): string {
	if (typeof value !== 'function') {
		return '';
	}
	const fn = value as { name?: string; length?: number };
	return `fn(${fn.name || '<anon>'}:${typeof fn.length === 'number' ? fn.length : '?'})`;
}

function propPartsForName (obj: AnyObject, n: string): string {
	const d = Object.getOwnPropertyDescriptor(obj, n) as PropertyDescriptor | undefined;
	if (!d) {
		return n + ':<missing>';
	}
	const kind = ('value' in d) ? 'value' : 'accessor';
	const en = !!d.enumerable;
	const cf = !!d.configurable;
	const fnMetaStr = kind === 'value' ? funcMeta(d.value) : '';
	return `${n}|${kind}|e${en ? 1 : 0}|c${cf ? 1 : 0}|${fnMetaStr}`;
}

function descriptorSignature (obj: AnyObject): string {
	try {
		const names = Object.getOwnPropertyNames(obj).sort();
		const syms = Object.getOwnPropertySymbols(obj).map(s => String(s)).sort();
		const parts: string[] = [];
		for (const n of names) {
			parts.push(propPartsForName(obj, n));
		}
		for (const s of syms) {
			parts.push(`SYM:${s}`);
		}
		const ext = (Object.isExtensible ? Object.isExtensible(obj) : true) ? 'ext' : 'noext';
		const sealed = (Object.isSealed ? Object.isSealed(obj) : false) ? 'sealed' : 'notsealed';
		const frozen = (Object.isFrozen ? Object.isFrozen(obj) : false) ? 'frozen' : 'notfrozen';
		return parts.join('|') + `|${ext}|${sealed}|${frozen}`;
	} catch (e) {
		return 'ERR';
	}
}

function getObjectChecksum (obj: AnyObject): number {
	const sig = descriptorSignature(obj);
	return fnv1a32(sig);
}

function buildNode (name: string, obj: AnyObject | undefined | null, children?: IntegrityNode[]): IntegrityNode {
	const localCrc = obj ? getObjectChecksum(obj) : 0;
	const childFold = (children && children.length)
		? children.map(c => c.crcNode || c.crcLocal).reduce((a, b) => combineHash(a, b), 0)
		: 0;
	const nodeCrc = combineHash(localCrc, childFold);
	return { name, crcLocal: localCrc, children, crcNode: nodeCrc };
}

function gatherOrderedTargets (extra?: Array<[string, any]>): string[] {
	const targets = [...jsFrozenBuiltins as readonly string[], ...browserFrozenBuiltins as readonly string[], ...nodeFrozenBuiltins as readonly string[]];
	const seen = new Set<string>();
	const ordered: string[] = [];
	for (const t of targets) {
		if (!seen.has(t)) {
			seen.add(t);
			ordered.push(t);
		}
	}
	if (extra) {
		for (const [n] of extra) {
			if (!seen.has(n)) {
				seen.add(n);
				ordered.push(n);
			}
		}
	}
	return ordered;
}

export function snapshotTree (opts?: { extraTargets?: Array<[string, any]> }): IntegrityTree {
	const extra = (opts && opts.extraTargets) || [];
	const ordered = gatherOrderedTargets(extra as Array<[string, any]>);

	const nodes: IntegrityNode[] = [];
	const G = typeof globalThis !== 'undefined' ? (globalThis as GlobalLike) : ({} as GlobalLike);
	for (const name of ordered) {
		let obj: AnyObject | undefined | null;
		try {
			obj = (G as AnyObject)[name as keyof AnyObject] as AnyObject | undefined | null;
		} catch (e) {
			obj = undefined;
		}
		const proto = obj && (obj as AnyObject).prototype ? (obj as AnyObject).prototype as AnyObject : undefined;
		const protoNode = proto ? buildNode(name + '.prototype', proto, []) : undefined;
		const node = buildNode(name, obj, protoNode ? [protoNode] : []);
		nodes.push(node);
	}

	const merkleRoot = nodes.map(n => n.crcNode || n.crcLocal).sort((a, b) => a - b).reduce((a, b) => combineHash(a, b), 0);
	return { nodes, merkleRoot };
}

export function diffTrees (a: IntegrityTree, b: IntegrityTree): Array<{ path: string; kind: 'changed' | 'missing' | 'new' }> {
	const mapA = new Map<string, number>();
	for (const n of a.nodes) {
		mapA.set(n.name, n.crcNode || n.crcLocal);
	}
	const diffs: Array<{ path: string; kind: 'changed' | 'missing' | 'new' }> = [];
	for (const n of b.nodes) {
		if (!mapA.has(n.name)) {
			diffs.push({ path: n.name, kind: 'new' });
		} else if (mapA.get(n.name) !== (n.crcNode || n.crcLocal)) {
			diffs.push({ path: n.name, kind: 'changed' });
		}
	}
	for (const n of a.nodes) {
		if (!b.nodes.find(x => x.name === n.name)) {
			diffs.push({ path: n.name, kind: 'missing' });
		}
	}
	return diffs;
}

export default { snapshotTree, diffTrees };
