/**
 * Minimal ambient declaration for `express`.
 *
 * Used so `trust-api` compiles without `@types/express` installed. When
 * a full `npm install` is possible (registry blocker resolved), delete
 * this directory and the `typeRoots` entry that points to it.
 */

declare module 'express' {
  export interface Request {
    headers: { [k: string]: string | string[] | undefined };
    method: string;
    originalUrl: string;
    url: string;
    params: { [k: string]: string };
    body: any;
    [key: string]: any;
  }

  export interface Response {
    status(code: number): Response;
    json(body: unknown): Response;
    send(body?: unknown): Response;
    setHeader(name: string, value: string): void;
    on(event: 'finish' | 'close', cb: () => void): void;
    statusCode?: number;
    headersSent?: boolean;
    [key: string]: any;
  }

  export type NextFunction = (err?: unknown) => void;
  export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
  export type ErrorRequestHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => void;

  export interface Router {
    get(path: string, ...handlers: RequestHandler[]): Router;
    post(path: string, ...handlers: RequestHandler[]): Router;
    use(...handlers: Array<RequestHandler | ErrorRequestHandler | Router>): Router;
  }

  export interface Application extends Router {
    listen(port: number, cb?: () => void): { close(cb?: () => void): void };
    use(...handlers: Array<RequestHandler | ErrorRequestHandler | Router | string>): Application;
  }

  interface ExpressFn {
    (): Application;
    Router(): Router;
    json(opts?: { limit?: string }): RequestHandler;
    urlencoded(opts?: { extended?: boolean }): RequestHandler;
  }

  const express: ExpressFn;
  export default express;
}
