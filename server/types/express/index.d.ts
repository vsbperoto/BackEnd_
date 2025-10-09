declare module "express" {
  export interface Request<
    Params = Record<string, string>,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = Record<string, unknown>,
  > {
    params: Params;
    body: ReqBody;
    query: ReqQuery;
    method: string;
    header(name: string): string | undefined;
    headers: Record<string, string | string[] | undefined>;
  }

  export interface Response<ResBody = unknown> {
    status(code: number): Response<ResBody>;
    json(body: ResBody): Response<ResBody>;
    sendStatus(code: number): Response<ResBody>;
    setHeader(name: string, value: string): void;
  }

  export type NextFunction = (...args: unknown[]) => void;

  export interface Router {
    use: (...args: unknown[]) => Router;
    get: (...args: unknown[]) => Router;
    post: (...args: unknown[]) => Router;
    patch: (...args: unknown[]) => Router;
    delete: (...args: unknown[]) => Router;
  }

  export interface Express extends Router {
    listen: (...args: unknown[]) => unknown;
  }

  export type RequestHandler = (
    req: Request,
    res: Response,
    next?: NextFunction,
  ) => unknown;

  export function Router(): Router;

  const express: {
    (): Express;
    Router(): Router;
  };

  export default express;
}
