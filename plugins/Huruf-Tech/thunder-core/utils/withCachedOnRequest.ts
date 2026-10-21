export type TCachedCallback<T> = (req: Request) => T;

const metadata: WeakMap<Request, Record<string, unknown>> = new WeakMap();

export const withCachedOnRequest = <T>(
  req: Request,
  key: string,
  callback: TCachedCallback<T>,
): T => {
  let data = metadata.get(req);

  if (!data) {
    data = {};
    metadata.set(req, data);
  }

  if (key in data) {
    return data[key] as T;
  }

  return data[key] = callback(req);
};
