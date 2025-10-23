import { snapshotTree } from './fingerprint';
import { chainFromSeed } from './hash';

export function enableIntegrityWorker (opts?: {
	intervalMs?: number;
	extraTargets?: Array<[string, any]>;
	onTamper?: (report: any) => void;
	useServiceWorker?: boolean;
	swUrl?: string;
	// test-only: expose a helper on window to trigger a notify from the worker
	exposeTestTrigger?: boolean;
}): { stop: () => void } {
	const intervalMs = opts && opts.intervalMs ? opts.intervalMs : 10000;
	const onTamper = opts && opts.onTamper;

	let worker: Worker | null = null;
	let timer = 0 as any;

	const workerSrc = `
self.onmessage = function (ev) {
	try {
		const data = ev.data;
		if (data && data.cmd === 'init') {
			const fn = ${snapshotTree.toString()};
			const chainFn = ${chainFromSeed.toString()};
			const interval = data.intervalMs;
			const seed = Math.floor(Date.now() / interval);
			const wTree = fn({ extraTargets: data.extraTargets });
			const wChain = chainFn(seed, wTree.merkleRoot);
			self.postMessage({ cmd: 'inited', seed: seed, merkleRoot: wTree.merkleRoot, chain: wChain });
		}
		if (data && data.cmd === 'verify') {
			const fn = ${snapshotTree.toString()};
			const chainFn = ${chainFromSeed.toString()};
			const interval = data.intervalMs;
			const seed = Math.floor(Date.now() / interval);
			const wTree = fn({ extraTargets: data.extraTargets });
			const wChain = chainFn(seed, wTree.merkleRoot);
			const ok = wChain === data.chain;
			const report = { ok, seedWorker: seed, merkleWorker: wTree.merkleRoot, chainWorker: wChain };
			if (!ok) report.reason = (wTree.merkleRoot !== data.merkleRoot) ? 'integrity_mismatch' : 'unknown';
			self.postMessage({ cmd: 'result', report, allowNotify: true });
		}
		if (data && data.cmd === 'notify') {
			try {
				if (self.registration && self.registration.showNotification) {
					self.registration.showNotification(data.title || 'Integrity alert', { body: data.body || '' });
					return;
				}
			} catch (e) { }
			self.postMessage({ cmd: 'notify-main', title: data.title, body: data.body });
		}
	} catch (e) { try { self.postMessage({ cmd: 'error', err: String(e) }); } catch (e) { } }
};
`;

	try {
		const blob = new Blob([workerSrc], { type: 'application/javascript' });
		worker = new Worker(URL.createObjectURL(blob));
	} catch (e) {
		worker = null;
	}

	function postVerify (): void {
		try {
			const mainTree = snapshotTree({ extraTargets: opts && opts.extraTargets });
			const seed = Math.floor(Date.now() / intervalMs);
			const chain = chainFromSeed(seed, mainTree.merkleRoot);
			if (worker) {
				worker.postMessage({ cmd: 'verify', intervalMs, extraTargets: opts && opts.extraTargets, seed, merkleRoot: mainTree.merkleRoot, chain });
			}
		} catch (e) { /* ignore */ }
	}

	function handleResult (r: any): void {
		if (r && !r.ok) {
			const mainTree = snapshotTree({ extraTargets: opts && opts.extraTargets });
			const diffs: Array<{ path: string; kind: string }> = [];
			if (onTamper) {
				onTamper({ reason: r.reason || 'mismatch', main: { seed: Math.floor(Date.now() / intervalMs), root: mainTree.merkleRoot, chain: chainFromSeed(Math.floor(Date.now() / intervalMs), mainTree.merkleRoot) }, worker: { seed: r.seedWorker, root: r.merkleWorker, chain: r.chainWorker }, diffs });
			}
			try {
				if (worker) {
					worker.postMessage({ cmd: 'notify', title: 'Integrity alert', body: 'Runtime integrity mismatch detected' });
				}
			} catch (e) { /* ignore */ }
		}
	}

	if (worker) {
		worker.onmessage = function (ev: MessageEvent) {
			const d = ev.data;
			if (!d || !d.cmd) {
				return;
			}
			if (d.cmd === 'result') {
				handleResult(d.report);
			} else if (d.cmd === 'notify-main') {
				try {
					if (typeof window !== 'undefined' && (window as any).Notification) {
						if ((window as any).Notification.permission === 'granted') {
							/* eslint-disable no-new */
							new (window as any).Notification(d.title || 'Integrity alert', { body: d.body || '' });
							/* eslint-enable no-new */
						}
					}
				} catch (e) { /* ignore */ }
			}
		};
		// test-only helper: allow tests to trigger notify path from the worker
		try {
			if (typeof window !== 'undefined' && opts && opts.exposeTestTrigger) {
				(window as any).__INTEG_TRIGGER_NOTIFY__ = function () {
					try {
						if (worker) {
							worker.postMessage({ cmd: 'notify', title: 'Integrity alert', body: 'test-trigger' });
						}
					} catch (e) { /* ignore */ }
				};
			}
		} catch (e) { /* ignore */ }
		try {
			if (worker) {
				worker.postMessage({ cmd: 'init', intervalMs, extraTargets: opts && opts.extraTargets });
			}
		} catch (e) { /* ignore */ }
	}

	timer = setInterval(postVerify, intervalMs) as unknown as number;

	return {
		stop: () => {
			if (timer) {
				clearInterval(timer);
			}
			if (worker) {
				worker.terminate();
				worker = null;
			}
		}
	};
}

export default { enableIntegrityWorker };
