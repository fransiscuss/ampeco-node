import { AmpecoApiError, AmpecoProtocolError } from "./errors.js";
import type { ApiEnvelope, Page, PageRequest } from "./types.js";

export type FetchImplementation = typeof fetch;
export type QueryScalar = string | number | boolean | Date | null | undefined;
export type QueryParameters = Record<string, QueryScalar | readonly QueryScalar[]>;

export interface AmpecoClientOptions {
  /** AMPECO tenant root, for example `https://example.ampeco.com`. */
  tenantUrl: string;
  /** API token from CHARGE Back Office → API Access Tokens. */
  apiKey: string;
  /** Override fetch, primarily for tests or a non-standard runtime. */
  fetch?: FetchImplementation;
  /** Extra headers included with every request. Request headers take precedence. */
  headers?: HeadersInit;
  /** Default page size for resource listing calls. Clamped to AMPECO's 1–100 range. */
  defaultPerPage?: number;
}

export interface RequestOptions {
  query?: QueryParameters;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export interface ApiResponse<T> {
  data: T;
  response: Response;
}

/**
 * Shared transport for AMPECO's Public API. It sends Bearer authentication,
 * parses AMPECO's `{ data: ... }` envelopes, and retains failure payloads.
 */
export class AmpecoApiClient {
  public readonly defaultPerPage: number;
  private readonly baseUrl: string;
  private readonly fetchImplementation: FetchImplementation;
  private readonly defaults: Headers;

  public constructor(options: AmpecoClientOptions) {
    if (!options.tenantUrl?.trim()) throw new Error("AMPECO client requires a tenantUrl.");
    if (!options.apiKey?.trim()) throw new Error("AMPECO client requires an apiKey.");

    const tenant = options.tenantUrl.trim().replace(/\/+$/, "");
    this.baseUrl = `${/https?:\/\//i.test(tenant) ? tenant : `https://${tenant}`}/public-api/`;
    this.fetchImplementation = options.fetch ?? globalThis.fetch;
    if (!this.fetchImplementation) throw new Error("No fetch implementation is available; use Node.js 18+ or provide options.fetch.");

    this.defaultPerPage = clampPerPage(options.defaultPerPage ?? 100);
    this.defaults = new Headers(options.headers);
    this.defaults.set("accept", "application/json");
    this.defaults.set("authorization", `Bearer ${options.apiKey}`);
  }

  public get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, undefined, options);
  }

  public post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body, options);
  }

  public put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, body, options);
  }

  public patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body, options);
  }

  public delete<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, body, options);
  }

  /** Returns an item from AMPECO's normal `{ data: item }` response envelope. */
  public async getData<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.unwrap<T>(await this.get<ApiEnvelope<T>>(path, options), path);
  }

  /** Sends an action request where AMPECO returns an empty 202/204 response. */
  public async sendNoContent(method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown, options?: RequestOptions): Promise<void> {
    await this.request<unknown>(method, path, body, options);
  }

  /** Parses an action response that is not wrapped in a `{ data: ... }` envelope. */
  public async postUnwrapped<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const result = await this.post<T>(path, body, options);
    if (result.data === undefined || result.data === null) throw new AmpecoProtocolError(`Expected a JSON body from '${path}' but the response was empty.`);
    return result.data;
  }

  /** Fetches a list response and exposes AMPECO cursor and legacy page metadata. */
  public async getPage<T>(path: string, query: QueryParameters = {}, pageRequest?: PageRequest, signal?: AbortSignal): Promise<Page<T>> {
    const requestQuery: QueryParameters = {
      ...query,
      cursor: pageRequest?.cursor ?? "",
      per_page: clampPerPage(pageRequest?.perPage ?? this.defaultPerPage),
    };
    const result = await this.get<{ data?: T[]; links?: PageLinks; meta?: PageMeta }>(path, { query: requestQuery, signal });
    const body = result.data;
    if (!body || !Array.isArray(body.data)) throw new AmpecoProtocolError(`Listing response from '${path}' did not contain a data array.`);
    const meta = body.meta ?? {};
    return {
      data: body.data,
      nextCursor: stringOrUndefined(meta.next_cursor) ?? stringOrUndefined(meta.cursor) ?? cursorFromLink(body.links?.next),
      prevCursor: stringOrUndefined(meta.prev_cursor) ?? cursorFromLink(body.links?.prev),
      currentPage: numberOrUndefined(meta.current_page),
      total: numberOrUndefined(meta.total),
      lastPage: numberOrUndefined(meta.last_page),
      perPage: numberOrUndefined(meta.per_page),
    };
  }

  /** Iterates a listing endpoint using cursor pagination, with legacy page fallback. */
  public async *stream<T>(path: string, query: QueryParameters = {}, pageRequest?: PageRequest, signal?: AbortSignal): AsyncIterable<T> {
    let cursor = pageRequest?.cursor;
    let pageNumber: number | undefined;
    do {
      const page = await this.getPage<T>(path, pageNumber === undefined ? query : { ...query, page: pageNumber }, { ...pageRequest, cursor }, signal);
      yield* page.data;
      if (page.nextCursor) {
        cursor = page.nextCursor;
        pageNumber = undefined;
      } else if (page.currentPage !== undefined && page.lastPage !== undefined && page.currentPage < page.lastPage) {
        cursor = undefined;
        pageNumber = page.currentPage + 1;
      } else {
        return;
      }
    } while (true);
  }

  private async request<T>(method: string, path: string, body: unknown, options: RequestOptions | undefined): Promise<ApiResponse<T>> {
    const url = new URL(path.replace(/^\/+/, ""), this.baseUrl);
    appendQuery(url, options?.query);
    const headers = new Headers(this.defaults);
    new Headers(options?.headers).forEach((value, name) => headers.set(name, value));
    if (body !== undefined) headers.set("content-type", "application/json");

    const response = await this.fetchImplementation(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options?.signal,
    });
    const text = await response.text();
    if (!response.ok) throw createApiError(response, text);
    if (response.status === 204 || text.trim() === "" || text.trim() === "[]") return { data: undefined as T, response };
    try {
      return { data: JSON.parse(text) as T, response };
    } catch {
      throw new AmpecoProtocolError(`AMPECO API returned invalid JSON for ${method} ${url.pathname}.`);
    }
  }

  private unwrap<T>(result: ApiResponse<ApiEnvelope<T>>, path: string): T {
    if (!result.data || !("data" in result.data) || result.data.data === undefined || result.data.data === null) {
      throw new AmpecoProtocolError(`Response from '${path}' did not contain a data property.`);
    }
    return result.data.data;
  }
}

interface PageLinks { next?: string | null; prev?: string | null }
interface PageMeta { [key: string]: unknown; next_cursor?: unknown; prev_cursor?: unknown; cursor?: unknown; current_page?: unknown; total?: unknown; last_page?: unknown; per_page?: unknown }

export function clampPerPage(perPage: number): number {
  if (!Number.isFinite(perPage)) return 100;
  return Math.max(1, Math.min(100, Math.trunc(perPage)));
}

function appendQuery(url: URL, query: QueryParameters | undefined): void {
  if (!query) return;
  for (const [name, input] of Object.entries(query)) {
    const values = Array.isArray(input) ? input : [input];
    for (const value of values) {
      if (value === null || value === undefined) continue;
      url.searchParams.append(name, value instanceof Date ? formatDate(value) : String(value));
    }
  }
}

export function formatDate(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function createApiError(response: Response, body: string): AmpecoApiError {
  let message = body;
  let errors: Record<string, readonly string[]> | undefined;
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === "object") {
      const payload = parsed as { message?: unknown; errors?: unknown };
      if (typeof payload.message === "string") message = payload.message;
      if (payload.errors && typeof payload.errors === "object" && !Array.isArray(payload.errors)) {
        errors = Object.fromEntries(Object.entries(payload.errors).map(([key, value]) => [key, Array.isArray(value) ? value.map(String) : [String(value)]]));
      }
    }
  } catch { /* The API can return an HTML/proxy response; retain it as-is. */ }
  return new AmpecoApiError(response.status, message, body, response.headers, errors);
}

function cursorFromLink(link: string | null | undefined): string | undefined {
  if (!link) return undefined;
  try { return new URL(link).searchParams.get("cursor") ?? undefined; } catch { return undefined; }
}
function stringOrUndefined(value: unknown): string | undefined { return typeof value === "string" && value.length > 0 ? value : undefined; }
function numberOrUndefined(value: unknown): number | undefined { return typeof value === "number" && Number.isFinite(value) ? value : undefined; }
