import { hardenJs, hardenNode } from './targets';

// Expose a single function to harden everything for Node
export function hardenAllNode (): void {
  // Run node and JS hardeners; browser one won't do anything in Node but exported for completeness
  try { hardenNode(); } catch (e) { /* ignore */ }
  try { hardenJs(); } catch (e) { /* ignore */ }
}

export default hardenAllNode;
