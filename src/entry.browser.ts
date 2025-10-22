import { hardenBrowser, hardenJs } from './targets';

export function hardenAllBrowser(): void {
  try { hardenJs(); } catch (e) { /* ignore */ }
  try { hardenBrowser(); } catch (e) { /* ignore */ }
}

export default hardenAllBrowser;
