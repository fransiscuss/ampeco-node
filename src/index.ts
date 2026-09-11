export { AmpecoApiClient, clampPerPage, formatDate } from "./client.js";
export type { AmpecoClientOptions, ApiResponse, FetchImplementation, QueryParameters, QueryScalar, RequestOptions } from "./client.js";
export { AmpecoApiError, AmpecoProtocolError } from "./errors.js";
export {
  CdrsClient, ChargePointsClient, EvsesClient, InvoicesClient, LocationsClient, PartnersClient, ReceiptsClient,
  ReservationsClient, RoamingClient, RoamingConnectionsClient, SessionsClient, SubscriptionsClient, TariffsClient,
  TransactionsClient, UsersClient, toFilterQuery,
} from "./resources.js";
export * from "./types.js";

import { AmpecoApiClient, type AmpecoClientOptions } from "./client.js";
import {
  CdrsClient, ChargePointsClient, EvsesClient, InvoicesClient, LocationsClient, PartnersClient, ReceiptsClient,
  ReservationsClient, RoamingClient, SessionsClient, SubscriptionsClient, TariffsClient, TransactionsClient, UsersClient,
} from "./resources.js";

/**
 * High-level AMPECO Public API client. Keep one instance per tenant/API token
 * and use its typed resource clients (`chargePoints`, `sessions`, etc.).
 */
export class AmpecoClient {
  public readonly chargePoints: ChargePointsClient;
  public readonly evses: EvsesClient;
  public readonly locations: LocationsClient;
  public readonly users: UsersClient;
  public readonly sessions: SessionsClient;
  public readonly transactions: TransactionsClient;
  public readonly tariffs: TariffsClient;
  public readonly reservations: ReservationsClient;
  public readonly partners: PartnersClient;
  public readonly cdrs: CdrsClient;
  public readonly invoices: InvoicesClient;
  public readonly receipts: ReceiptsClient;
  public readonly subscriptions: SubscriptionsClient;
  public readonly roaming: RoamingClient;

  /** Low-level client for endpoints not yet represented by a resource client. */
  public readonly api: AmpecoApiClient;

  public constructor(options: AmpecoClientOptions) {
    this.api = new AmpecoApiClient(options);
    this.chargePoints = new ChargePointsClient(this.api);
    this.evses = new EvsesClient(this.api);
    this.locations = new LocationsClient(this.api);
    this.users = new UsersClient(this.api);
    this.sessions = new SessionsClient(this.api);
    this.transactions = new TransactionsClient(this.api);
    this.tariffs = new TariffsClient(this.api);
    this.reservations = new ReservationsClient(this.api);
    this.partners = new PartnersClient(this.api);
    this.cdrs = new CdrsClient(this.api);
    this.invoices = new InvoicesClient(this.api);
    this.receipts = new ReceiptsClient(this.api);
    this.subscriptions = new SubscriptionsClient(this.api);
    this.roaming = new RoamingClient(this.api);
  }
}
