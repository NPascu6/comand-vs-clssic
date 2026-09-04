// No axios/react-query: the team avoids library coupling.

export async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}

export async function postJson<T, TBody extends object = object>(url: string, body: TBody): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`POST ${url} -> ${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}
