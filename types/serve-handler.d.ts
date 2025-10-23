declare module 'serve-handler' {
  import { IncomingMessage, ServerResponse } from 'http';
  export default function handler(req: IncomingMessage, res: ServerResponse, opts?: any): Promise<void> | void;
}
