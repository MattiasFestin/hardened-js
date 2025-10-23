import { describe, it, expect } from 'vitest';
import { snapshotTree, diffTrees } from '../src/integrity/fingerprint';

describe('integrity/fingerprint', () => {
	it('snapshotTree returns nodes and a merkleRoot', () => {
		const tree = snapshotTree();
		expect(tree).toBeTruthy();
		expect(Array.isArray(tree.nodes)).toBe(true);
		expect(typeof tree.merkleRoot).toBe('number');
		// nodes should contain entries for canonical builtins like 'Object' or 'Array'
		expect(tree.nodes.find(n => n.name === 'Object' || n.name === 'Array')).toBeTruthy();
	});

	it('snapshotTree includes extraTargets and diffTrees detects new nodes', () => {
		const base = snapshotTree();
		const extra = snapshotTree({ extraTargets: [['__TEST_EXTRA__', { foo: 1 }]] });
		// extra should contain our synthetic node
		expect(extra.nodes.find(n => n.name === '__TEST_EXTRA__')).toBeTruthy();
		const diffs = diffTrees(base, extra);
		// should report a 'new' node for our extra target
		expect(diffs.find(d => d.path === '__TEST_EXTRA__' && d.kind === 'new')).toBeTruthy();
	});

	it('diffTrees detects missing and changed nodes', () => {
		// install objects on globalThis so snapshotTree can inspect descriptors
		(globalThis as any).__A__ = { a: 1 };
		(globalThis as any).__B__ = { b: 1 };
		const treeA = snapshotTree({ extraTargets: [['__A__', null], ['__B__', null]] });
		// modify global __A__ and remove __B__ to simulate change + missing
		(globalThis as any).__A__ = { a: 1, added: true };
		delete (globalThis as any).__B__;
		const treeB = snapshotTree({ extraTargets: [['__A__', null]] });
		const diffs = diffTrees(treeA, treeB);
		// cleanup
		delete (globalThis as any).__A__;
		// __B__ should be missing in treeB
		expect(diffs.find(d => d.path === '__B__' && d.kind === 'missing')).toBeTruthy();
		// __A__ should be changed because the object descriptor differs
		expect(diffs.find(d => d.path === '__A__' && d.kind === 'changed')).toBeTruthy();
	});
});
