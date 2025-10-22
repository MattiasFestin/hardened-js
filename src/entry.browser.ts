import { hardenBrowser, hardenJs, removeBrowser, removeJs } from './targets';

export function hardenAllBrowser (): void {
	try { hardenJs(); } catch (e) { /* ignore */ }
	try { hardenBrowser(); } catch (e) { /* ignore */ }
}

export function removeAllBrowser (paths?: string[]): void {
	try { removeJs(paths); } catch (e) { /* ignore */ }
	try { removeBrowser(paths); } catch (e) { /* ignore */ }
}

export default hardenAllBrowser;
