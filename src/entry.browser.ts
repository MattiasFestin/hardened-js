import { hardenBrowser, hardenJs, removeBrowser, removeJs } from './targets';
import { enableIntegrityWorker } from './integrity';

export function hardenAllBrowser (): void {
	try { hardenJs(); } catch (e) { /* ignore */ }
	try { hardenBrowser(); } catch (e) { /* ignore */ }
}

export function removeAllBrowser (paths?: string[]): void {
	try { removeJs(paths); } catch (e) { /* ignore */ }
	try { removeBrowser(paths); } catch (e) { /* ignore */ }
}

// re-export enableIntegrityWorker so the browser bundle exposes it on the global
export { enableIntegrityWorker };

export default hardenAllBrowser;
