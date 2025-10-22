import { hardenJs, hardenNode, removeNode, removeJs } from './targets';

// Expose a single function to harden everything for Node
export function hardenAllNode (): void {
	// Run node and JS hardeners; browser one won't do anything in Node but exported for completeness
	try { hardenNode(); } catch (e) { /* ignore */ }
	try { hardenJs(); } catch (e) { /* ignore */ }
}

export function removeAllNode (paths?: string[]): void {
	try { removeJs(paths); } catch (e) { /* ignore */ }
	try { removeNode(paths); } catch (e) { /* ignore */ }
}

export default hardenAllNode;
