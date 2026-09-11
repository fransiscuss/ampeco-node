import { AmpecoApiClient, type QueryParameters } from "./client.js";
import type {
  Cdr, CdrFilter, CancelReservationRequest, ChargePoint, ChargePointFilter, ChargePointStatusInfo, ChargePointWrite,
  CreatePreAuthorizationRequest, Evse, EvseFilter, EvseWrite, Filter, Invoice, InvoiceFilter, Location, LocationFilter, LocationWrite,
  Page, PageRequest, Partner, PartnerFilter, PartnerWrite, PreAuthorizationResponse, Receipt, ReceiptFilter,
  Reservation, ReservationFilter, ReserveEvseRequest, RoamingConnection, RoamingOperator, RoamingOperatorFilter,
  RoamingOperatorWrite, Session, SessionFilter, SessionQuery, StartChargingResult, StartSessionRequest, Subscription, SubscriptionFilter,
  Tariff, TariffFilter, TariffWrite, Transaction, TransactionFilter, TransactionWrite, User, UserFilter, UserWrite,
} from "./types.js";

const paths = {
  chargePoints: "resources/charge-points/v2.0",
  evses: "resources/evses/v2.1",
  locations: "resources/locations/v2.0",
  users: "resources/users/v1.1",
  sessions: "resources/sessions/v1.0",
  transactions: "resources/transactions/v1.0",
  tariffs: "resources/tariffs/v1.0",
  reservations: "resources/reservations/v1.0",
  partners: "resources/partners/v2.0",
  cdrs: "resources/cdrs/v2.0",
  invoices: "resources/invoices/v1.0",
  receipts: "resources/receipts/v2.0",
  subscriptions: "resources/subscriptions/v1.0",
  roamingOperators: "resources/roaming-operators/v2.0",
  roamingConnections: "resources/roaming-connections/v2.0",
  chargePointActions: "actions/charge-point/v1.0",
  evseActions: "actions/evse/v1.0",
  sessionActions: "actions/session/v1.0",
  transactionActions: "actions/transaction/v1.0",
  reservationActions: "actions/reservation/v1.0",
} as const;

/** Converts AMPECO filter objects into Laravel deep-object query parameters. */
export function toFilterQuery(filter?: Filter): QueryParameters {
  const query: QueryParameters = {};
  const add = (key: string, value: Filter[string]): void => {
    if (value === undefined) return;
    if (value instanceof Date || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      query[`filter[${key}]`] = value;
      return;
    }
    if (Array.isArray(value)) {
      query[`filter[${key}][]`] = value;
      return;
    }
    for (const [nestedKey, nestedValue] of Object.entries(value)) add(`${key}][${nestedKey}`, nestedValue);
  };
  for (const [key, value] of Object.entries(filter ?? {})) add(key, value);
  return query;
}

abstract class ResourceClient<T, TFilter extends Filter = Filter> {
  protected constructor(protected readonly api: AmpecoApiClient, protected readonly resourcePath: string) {}

  public get(id: string | number, signal?: AbortSignal): Promise<T> {
    return this.api.getData<T>(`${this.resourcePath}/${segment(id)}`, { signal });
  }

  public getPage(filter?: TFilter, pageRequest?: PageRequest, signal?: AbortSignal): Promise<Page<T>> {
    return this.api.getPage<T>(this.resourcePath, toFilterQuery(filter), pageRequest, signal);
  }

  public stream(filter?: TFilter, perPage?: number, signal?: AbortSignal): AsyncIterable<T> {
    return this.api.stream<T>(this.resourcePath, toFilterQuery(filter), { perPage }, signal);
  }
}

abstract class WritableResourceClient<T, TWrite, TFilter extends Filter = Filter> extends ResourceClient<T, TFilter> {
  public async create(value: TWrite, signal?: AbortSignal): Promise<T> {
    return unwrap<T>(await this.api.post<{ data?: T }>(this.resourcePath, value, { signal }), this.resourcePath);
  }

  public async update(id: string | number, value: TWrite, signal?: AbortSignal): Promise<T> {
    const path = `${this.resourcePath}/${segment(id)}`;
    return unwrap<T>(await this.api.patch<{ data?: T }>(path, value, { signal }), path);
  }

  public delete(id: string | number, signal?: AbortSignal): Promise<void> {
    return this.api.sendNoContent("DELETE", `${this.resourcePath}/${segment(id)}`, undefined, { signal });
  }
}

export class ChargePointsClient extends WritableResourceClient<ChargePoint, ChargePointWrite, ChargePointFilter> {
  public constructor(api: AmpecoApiClient) { super(api, paths.chargePoints); }
  public getStatus(chargePointId: number, signal?: AbortSignal): Promise<ChargePointStatusInfo> {
    return this.api.getData<ChargePointStatusInfo>(`${paths.chargePoints}/${segment(chargePointId)}/status`, { signal });
  }
  public async startCharging(chargePointId: number, evseIdOrRequest?: number | StartSessionRequest, requestOrSignal?: StartSessionRequest | AbortSignal, signal?: AbortSignal): Promise<StartChargingResult | undefined> {
    const [evseId, request, abortSignal] = typeof evseIdOrRequest === "number"
      ? requestOrSignal instanceof AbortSignal
        // startCharging(id, evseId, signal): the signal arrives in the request slot.
        ? [evseIdOrRequest, undefined, requestOrSignal]
        : [evseIdOrRequest, requestOrSignal, signal]
      : [undefined, evseIdOrRequest, requestOrSignal instanceof AbortSignal ? requestOrSignal : undefined];
    const path = `${paths.chargePointActions}/${segment(chargePointId)}/start${evseId === undefined ? "" : `/${segment(evseId)}`}`;
    return (await this.api.post<StartChargingResult>(path, request, { signal: abortSignal })).data;
  }
  public stopCharging(chargePointId: number, sessionId: string, force?: boolean, signal?: AbortSignal): Promise<void> {
    return this.api.sendNoContent("POST", `${paths.chargePointActions}/${segment(chargePointId)}/stop/${segment(sessionId)}`, force === undefined ? undefined : { force }, { signal });
  }
  public async reset(chargePointId: number, resetType: string, signal?: AbortSignal): Promise<boolean> {
    return Boolean((await this.api.postUnwrapped<{ success?: boolean }>(`${paths.chargePointActions}/${segment(chargePointId)}/reset/${segment(resetType)}`, undefined, { signal })).success);
  }
  public changeAvailability(chargePointId: number, type: string, evseNetworkId?: number, signal?: AbortSignal): Promise<void> {
    return this.api.sendNoContent("POST", `${paths.chargePointActions}/${segment(chargePointId)}/change-availability`, { type, evseNetworkId }, { signal });
  }
  public async unlockEvse(chargePointId: number, evseId: number, signal?: AbortSignal): Promise<boolean> {
    return Boolean((await this.api.postUnwrapped<{ success?: boolean }>(`${paths.chargePointActions}/${segment(chargePointId)}/unlock/${segment(evseId)}`, undefined, { signal })).success);
  }
  public reserveEvse(chargePointId: number, evseId: number, request: ReserveEvseRequest, signal?: AbortSignal): Promise<void> {
    return this.api.sendNoContent("POST", `${paths.chargePointActions}/${segment(chargePointId)}/reserve/${segment(evseId)}`, request, { signal });
  }
}

export class EvsesClient extends WritableResourceClient<Evse, EvseWrite, EvseFilter> {
  public constructor(api: AmpecoApiClient) { super(api, paths.evses); }
  public async startCharging(evseId: number, request?: StartSessionRequest, signal?: AbortSignal): Promise<StartChargingResult | undefined> {
    return (await this.api.post<StartChargingResult>(`${paths.evseActions}/${segment(evseId)}/start`, request, { signal })).data;
  }
}
export class LocationsClient extends WritableResourceClient<Location, LocationWrite, LocationFilter> { public constructor(api: AmpecoApiClient) { super(api, paths.locations); } }
export class UsersClient extends WritableResourceClient<User, UserWrite, UserFilter> { public constructor(api: AmpecoApiClient) { super(api, paths.users); } }
export class TariffsClient extends WritableResourceClient<Tariff, TariffWrite, TariffFilter> {
  public constructor(api: AmpecoApiClient) { super(api, paths.tariffs); }
  public async replace(id: number, value: TariffWrite, signal?: AbortSignal): Promise<Tariff> {
    const path = `${paths.tariffs}/${segment(id)}`;
    return unwrap<Tariff>(await this.api.put<{ data?: Tariff }>(path, value, { signal }), path);
  }
}
export class PartnersClient extends WritableResourceClient<Partner, PartnerWrite, PartnerFilter> { public constructor(api: AmpecoApiClient) { super(api, paths.partners); } }
export class TransactionsClient extends WritableResourceClient<Transaction, TransactionWrite, TransactionFilter> {
  public constructor(api: AmpecoApiClient) { super(api, paths.transactions); }
  public async createPreAuthorization(transactionId: number, request: CreatePreAuthorizationRequest, signal?: AbortSignal): Promise<PreAuthorizationResponse> {
    const path = `${paths.transactionActions}/${segment(transactionId)}/create-pre-authorization`;
    return unwrap<PreAuthorizationResponse>(await this.api.post<{ data?: PreAuthorizationResponse }>(path, request, { signal }), path);
  }
}

export class SessionsClient {
  public constructor(private readonly api: AmpecoApiClient) {}
  public get(sessionId: string, query?: SessionQuery, signal?: AbortSignal): Promise<Session> {
    return this.api.getData<Session>(`${paths.sessions}/${segment(sessionId)}`, { query: sessionQuery(query), signal });
  }
  public getPage(filter?: SessionFilter, query?: SessionQuery, pageRequest?: PageRequest, signal?: AbortSignal): Promise<Page<Session>> {
    return this.api.getPage<Session>(paths.sessions, { ...toFilterQuery(filter), ...sessionQuery(query) }, pageRequest, signal);
  }
  public stream(filter?: SessionFilter, query?: SessionQuery, perPage?: number, signal?: AbortSignal): AsyncIterable<Session> {
    return this.api.stream<Session>(paths.sessions, { ...toFilterQuery(filter), ...sessionQuery(query) }, { perPage }, signal);
  }
  public async updateCustomFields(sessionId: string, customFields: Record<string, unknown>, signal?: AbortSignal): Promise<Session> {
    const path = `${paths.sessions}/${segment(sessionId)}`;
    return unwrap<Session>(await this.api.patch<{ data?: Session }>(path, { customFields }, { signal }), path);
  }
  public changeTariff(sessionId: string, tariffId: number, signal?: AbortSignal): Promise<void> { return this.api.sendNoContent("POST", `${paths.sessionActions}/${segment(sessionId)}/change-tariff`, { tariffId }, { signal }); }
  public assignUser(sessionId: string, userId: number | null, signal?: AbortSignal): Promise<void> { return this.api.sendNoContent("POST", `${paths.sessionActions}/${segment(sessionId)}/assign-user`, { userId }, { signal }); }
  public retryPayment(sessionId: string, signal?: AbortSignal): Promise<void> { return this.api.sendNoContent("POST", `${paths.sessionActions}/${segment(sessionId)}/retry-payment`, undefined, { signal }); }
}

export class ReservationsClient extends ResourceClient<Reservation, ReservationFilter> {
  public constructor(api: AmpecoApiClient) { super(api, paths.reservations); }
  public cancel(reservationId: number, request?: CancelReservationRequest, signal?: AbortSignal): Promise<void> { return this.api.sendNoContent("POST", `${paths.reservationActions}/${segment(reservationId)}/cancel`, request, { signal }); }
}
export class CdrsClient extends ResourceClient<Cdr, CdrFilter> { public constructor(api: AmpecoApiClient) { super(api, paths.cdrs); } }
export class InvoicesClient extends ResourceClient<Invoice, InvoiceFilter> { public constructor(api: AmpecoApiClient) { super(api, paths.invoices); } }
export class ReceiptsClient extends ResourceClient<Receipt, ReceiptFilter> { public constructor(api: AmpecoApiClient) { super(api, paths.receipts); } }
export class SubscriptionsClient extends ResourceClient<Subscription, SubscriptionFilter> { public constructor(api: AmpecoApiClient) { super(api, paths.subscriptions); } }

export class RoamingConnectionsClient extends ResourceClient<RoamingConnection> { public constructor(api: AmpecoApiClient) { super(api, paths.roamingConnections); } }
export class RoamingClient extends ResourceClient<RoamingOperator, RoamingOperatorFilter> {
  public readonly connections: RoamingConnectionsClient;
  public constructor(api: AmpecoApiClient) { super(api, paths.roamingOperators); this.connections = new RoamingConnectionsClient(api); }
  public getOperator(id: number, signal?: AbortSignal): Promise<RoamingOperator> { return this.get(id, signal); }
  public getOperatorsPage(filter?: RoamingOperatorFilter, pageRequest?: PageRequest, signal?: AbortSignal): Promise<Page<RoamingOperator>> { return this.getPage(filter, pageRequest, signal); }
  public streamOperators(filter?: RoamingOperatorFilter, perPage?: number, signal?: AbortSignal): AsyncIterable<RoamingOperator> { return this.stream(filter, perPage, signal); }
  public async updateOperator(id: number, value: RoamingOperatorWrite, signal?: AbortSignal): Promise<RoamingOperator> {
    const path = `${paths.roamingOperators}/${segment(id)}`;
    return unwrap<RoamingOperator>(await this.api.patch<{ data?: RoamingOperator }>(path, value, { signal }), path);
  }
}

function sessionQuery(value?: SessionQuery): QueryParameters {
  if (!value) return {};
  const { includeCustomFields, ...flags } = value;
  return { ...flags, ...(includeCustomFields ? { "include[]": "externalAppData" } : {}) };
}
function segment(value: string | number): string { return encodeURIComponent(String(value)); }
function unwrap<T>(result: { data: { data?: T } }, path: string): T {
  if (result.data.data === undefined || result.data.data === null) throw new Error(`Response from '${path}' did not contain a data property.`);
  return result.data.data;
}
