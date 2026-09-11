/** An unsuccessful response returned by the AMPECO Public API. */
export class AmpecoApiError extends Error {
  /** HTTP status returned by AMPECO. */
  public readonly status: number;
  /** Unparsed response body, useful when reporting an API problem. */
  public readonly response: string;
  /** Per-field validation messages, normally provided for HTTP 422. */
  public readonly errors?: Readonly<Record<string, readonly string[]>>;
  public readonly headers: Headers;

  public constructor(
    status: number,
    message: string,
    response: string,
    headers: Headers,
    errors?: Readonly<Record<string, readonly string[]>>,
  ) {
    super(`AMPECO API returned status ${status}${message ? `: ${message}` : ""}`);
    this.name = "AmpecoApiError";
    this.status = status;
    this.response = response;
    this.headers = headers;
    this.errors = errors;
  }
}

/** A successful response that did not follow AMPECO's documented JSON shape. */
export class AmpecoProtocolError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AmpecoProtocolError";
  }
}
