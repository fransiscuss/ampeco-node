/** JSON-shaped values returned by, or supplied to, AMPECO. */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject { [key: string]: JsonValue | undefined; }

/** AMPECO wraps normal resource responses in this envelope. */
export interface ApiEnvelope<T> { data?: T; message?: string; }

/** A single resource-list page. Prefer `stream()` to transparently read all pages. */
export interface Page<T> {
  data: T[];
  nextCursor?: string;
  prevCursor?: string;
  perPage?: number;
  currentPage?: number;
  total?: number;
  lastPage?: number;
}

export interface PageRequest { perPage?: number; cursor?: string; }

/** A permissive base for API objects, retaining fields added by AMPECO in future versions. */
export interface ApiObject { [key: string]: unknown; }
export type DateTime = string | Date;

export interface GeoPosition extends ApiObject { latitude?: number; longitude?: number; }
export interface TranslatedText extends ApiObject { language?: string; text?: string; }
export type TranslatedTextList = TranslatedText[];
export interface WorkingHoursInterval extends ApiObject { start?: string; end?: string; }
export interface DayWorkingHours extends ApiObject { weekday?: number; periods?: WorkingHoursInterval[]; }
export interface WorkingHours extends ApiObject { regularHours?: DayWorkingHours[]; exceptionalOpenings?: unknown[]; exceptionalClosings?: unknown[]; }
export interface Note extends ApiObject { id?: number; text?: string; createdAt?: string; }
export interface NoteWrite extends ApiObject { text?: string; }
export interface ContactPerson extends ApiObject { name?: string; email?: string; phone?: string; }
export interface PowerOptions extends ApiObject { maxPowerKw?: number; maxCurrentA?: number; phases?: number; }
export interface EvseCapabilityOverrides extends ApiObject { [key: string]: unknown; }
export interface DurationBreakdown extends ApiObject { charging?: number; idle?: number; total?: number; }
export interface CardDetails extends ApiObject { brand?: string; last4?: string; expiryMonth?: number; expiryYear?: number; }

export interface ChargePoint extends ApiObject {
  id?: number; operatorId?: number; name?: string; type?: string; pin?: string; locationId?: number;
  chargingZoneId?: number; electricityRateId?: number; networkType?: string; status?: string;
  networkStatus?: string; hardwareStatus?: string; externalId?: string; network?: ChargePointNetwork;
  capabilities?: string[]; user?: ChargePointOwner; partner?: ChargePointPartner; createdAt?: string; lastUpdatedAt?: string;
}
export interface ChargePointNetwork extends ApiObject { id?: string; protocol?: string; password?: string; ip?: string; port?: number; }
export interface PowerSharing extends ApiObject { enabled?: boolean; managementMode?: string; totalCabinetPowerKw?: number; moduleSizeKw?: number; }
export interface ChargePointSecurity extends ApiObject { desiredProfile?: number; currentProfile?: number; desiredProfileStatus?: string; }
export interface ChargePointSubscription extends ApiObject { subscriptionId?: number; isActive?: boolean; }
export interface ChargePointOwner extends ApiObject { id?: number; name?: string; email?: string; }
export interface ChargePointPartner extends ApiObject { id?: number; contractId?: number; contactId?: number; corporateBillingAsDefault?: boolean; }
export interface ChargePointBootNotification extends ApiObject { model?: string; vendor?: string; firmwareVersion?: string; receivedAt?: string; }
export interface ChargePointWrite extends ApiObject {
  name?: string; type?: string; pin?: string; locationId?: number; chargingZoneId?: number; electricityRateId?: number;
  networkType?: string; communicationMode?: string; powerSharing?: PowerSharing; status?: string; managedByOperator?: boolean;
  externalId?: string; capabilities?: string[]; autoStartWithoutAuthorization?: boolean; disableAutoStartEmulation?: boolean;
  security?: ChargePointWriteSecurity; modelId?: number; monitoringEnabled?: boolean; autoRecoveryEnabled?: boolean;
  enableAutoFaultRecovery?: boolean; user?: ChargePointWriteOwner; utilityId?: number; tags?: string[]; uptimeTrackingEnabled?: boolean;
  sharingCode?: string; enabledRandomisedDelay?: boolean; usesRenewableEnergy?: boolean; integratedAt?: DateTime;
  manufacturedAt?: DateTime; ocppConnectedChargePointId?: number; countryStationId?: string;
}
export interface ChargePointWriteSecurity extends ApiObject { desiredLevel?: number; }
export interface ChargePointWriteOwner extends ApiObject { id?: number; email?: string; }
export interface ChargePointStatusInfo extends ApiObject { networkStatus?: string; hardwareStatus?: string; evses?: EvseStatusInfo[]; }
export interface EvseStatusInfo extends ApiObject { id?: number; status?: string; connectors?: ConnectorStatusInfo[]; }
export interface ConnectorStatusInfo extends ApiObject { id?: number; status?: string; }

export interface Evse extends ApiObject {
  id?: number; operatorId?: number; chargePointId?: number; physicalReference?: string; externalId?: string;
  status?: string; hardwareStatus?: string; currentType?: string; connectors?: Connector[]; maxPowerKw?: number;
  roaming?: EvseRoaming; createdAt?: string; lastUpdatedAt?: string;
}
export interface EvseRoaming extends ApiObject { evseId?: string; status?: string; lastUpdated?: string; }
export interface ChargingProfile extends ApiObject { chargingProfileId?: number; stackLevel?: number; chargingProfilePurpose?: string; chargingProfileKind?: string; chargingSchedule?: ChargingSchedule; }
export interface ChargingSchedule extends ApiObject { duration?: number; startSchedule?: DateTime; chargingRateUnit?: string; chargingSchedulePeriod?: ChargingSchedulePeriod[]; minChargingRate?: number; }
export interface ChargingSchedulePeriod extends ApiObject { startPeriod?: number; limit?: number; numberPhases?: number; }
export interface Connector extends ApiObject { id?: number; type?: string; format?: string; status?: string; maxPowerKw?: number; maxCurrentA?: number; }
export interface EvseWrite extends ApiObject {
  chargePointId?: number; physicalReference?: string; externalId?: string; status?: string; currentType?: string;
  connectors?: Connector[]; maxPowerKw?: number; chargingProfiles?: ChargingProfile[]; roaming?: EvseRoaming; capabilities?: EvseCapabilityOverrides;
}

export interface Location extends ApiObject {
  id?: number; operatorId?: number; name?: string; status?: string; externalId?: string; country?: string; city?: string;
  address?: string; postCode?: string; coordinates?: GeoPosition; timeZone?: string; evses?: Evse[]; chargingZones?: ChargingZone[];
  createdAt?: string; lastUpdatedAt?: string;
}
export interface ChargingZone extends ApiObject { id?: number; name?: string; locationId?: number; }
export interface LocationRoaming extends ApiObject { [key: string]: unknown; }
export interface RoamingEntityName extends ApiObject { [key: string]: unknown; }
export interface LocationWrite extends ApiObject {
  name?: string; status?: string; externalId?: string; country?: string; city?: string; state?: string; postCode?: string;
  address?: string; coordinates?: GeoPosition; timeZone?: string; parkingType?: string; accessMethods?: string[]; directions?: TranslatedText[];
  openingTimes?: WorkingHours; chargingZones?: ChargingZone[]; partnerId?: number; tags?: string[];
}

export interface User extends ApiObject { id?: number; email?: string; status?: string; firstName?: string; middleName?: string; lastName?: string; phone?: string; externalId?: string; createdAt?: string; lastUpdatedAt?: string; options?: UserOptions; }
export interface UserOptions extends ApiObject { [key: string]: unknown; }
export interface UserWrite extends ApiObject {
  email?: string; password?: string; status?: string; firstName?: string; middleName?: string; lastName?: string; phone?: string;
  country?: string; state?: string; city?: string; postCode?: string; address?: string; vehicleNo?: string; personalId?: string;
  companyName?: string; companyTaxId?: string; companyAddress?: string; companyCity?: string; companyPostalCode?: string;
  companyCountry?: string; companyReceiptsEnabled?: boolean; locale?: string; userGroupIds?: number[]; externalId?: string;
  options?: UserOptions; receiveNewsAndPromotions?: boolean; partnerId?: number; nonce?: string;
}

export interface Session extends ApiObject {
  id?: string; operatorId?: number; chargePointId?: number; evseId?: number; userId?: number; status?: string;
  startedAt?: string; endedAt?: string; energyKwh?: number; totalAmount?: SessionTotalAmount; currency?: string;
  paymentStatus?: string; billingStatus?: string; reason?: string; authorization?: SessionAuthorization; priceBreakdown?: SessionPriceBreakdown;
}
export interface SessionTotalAmount extends ApiObject { amount?: number; currency?: string; }
export interface SessionDiscount extends ApiObject { amount?: number; name?: string; }
export interface ClockAlignedEnergyConsumption extends ApiObject { timestamp?: string; energyKwh?: number; }
export interface SessionPriceBreakdown extends ApiObject { [key: string]: unknown; }
export interface ChargingPeriod extends ApiObject { startDateTime?: string; endDateTime?: string; energyKwh?: number; }
export interface SessionAuthorization extends ApiObject { idTag?: string; userId?: number; source?: string; }
export interface SessionQuery { withClockAlignedEnergyConsumption?: boolean; clockAlignedInterval?: number; withAuthorization?: boolean; withPriceBreakdown?: boolean; withChargingPeriods?: boolean; withChargingPeriodsPriceBreakdown?: boolean; withDurationBreakdown?: boolean; includeCustomFields?: boolean; }
export interface SessionStopConditions extends ApiObject { maxEnergyKwh?: number; maxDurationMinutes?: number; maxAmount?: number; }
export interface StartSessionRequest extends ApiObject { userId?: number; paymentMethodId?: string; connectorId?: number; bookingId?: number; stopConditions?: SessionStopConditions; chargingProfile?: SmartChargingProfile; idTag?: string; }
/** AMPECO may return this command result in a HTTP 202 response. */
export interface StartChargingResult extends ApiObject { success?: boolean; sessionId?: string | number | null; authorizationId?: string | number | null; message?: string; errorCode?: string; }
export interface SmartChargingProfile extends ApiObject { chargingProfileId?: number; stackLevel?: number; chargingProfilePurpose?: string; chargingProfileKind?: string; chargingSchedule?: ChargingSchedule; }

export interface Transaction extends ApiObject { id?: number; operatorId?: number; userId?: number; sessionId?: number; status?: string; amount?: number; totalAmount?: number; currency?: string; paymentMethod?: string; createdAt?: string; }
export interface TransactionWrite extends ApiObject { userId?: number; sessionId?: number; amount?: number; currency?: string; status?: string; paymentMethod?: TransactionPaymentMethodWrite; invoiceDetails?: TransactionInvoiceDetailsWrite; ref?: string; }
export interface TransactionPaymentMethodWrite extends ApiObject { type?: string; token?: string; card?: CardDetails; }
export interface TransactionInvoiceDetailsWrite extends ApiObject { [key: string]: unknown; }
export interface PreAuthorizationResponse extends ApiObject { [key: string]: unknown; }
export interface CreatePreAuthorizationRequest extends ApiObject { processor?: string; amount?: number; currency?: string; returnUrl?: string; }

export interface Tariff extends ApiObject { id?: number; operatorId?: number; name?: string; type?: string; currency?: string; pricing?: TariffPricing; createdAt?: string; lastUpdatedAt?: string; }
export interface TariffPricing extends ApiObject { [key: string]: unknown; }
export interface TariffDiscountSettings extends ApiObject { [key: string]: unknown; }
export interface TariffDiscountElement extends ApiObject { [key: string]: unknown; }
export interface TariffStopSession extends ApiObject { [key: string]: unknown; }
export interface TariffRestrictions extends ApiObject { [key: string]: unknown; }
export interface TariffPartner extends ApiObject { [key: string]: unknown; }
export interface TariffDisplay extends ApiObject { [key: string]: unknown; }
export interface TariffWrite extends ApiObject { name?: string; type?: string; currency?: string; pricing?: TariffPricing; discountSettings?: TariffDiscountSettings; restrictions?: TariffRestrictions; }

export interface Reservation extends ApiObject { id?: number; evseId?: number; userId?: number; status?: string; reservedFrom?: string; reservedTo?: string; }
export interface CancelReservationRequest extends ApiObject { force?: boolean; reason?: string; }
export interface ReserveEvseRequest extends ApiObject { userId?: number; reservedFrom?: DateTime; reservedTo?: DateTime; expiryDate?: DateTime; idTag?: string; }

export interface Partner extends ApiObject { id?: number; operatorId?: number; name?: string; country?: string; externalId?: string; createdAt?: string; lastUpdatedAt?: string; }
export interface PartnerNotifications extends ApiObject { [key: string]: unknown; }
export interface PartnerTechnicalNotifications extends ApiObject { [key: string]: unknown; }
export interface PartnerBillingNotifications extends ApiObject { [key: string]: unknown; }
export interface PartnerOptions extends ApiObject { [key: string]: unknown; }
export interface PartnerCorporateBilling extends ApiObject { [key: string]: unknown; }
export interface PartnerWrite extends ApiObject { name?: string; country?: string; externalId?: string; notifications?: PartnerWriteNotifications; options?: PartnerOptions; }
export interface PartnerWriteNotifications extends ApiObject { [key: string]: unknown; }
export interface PartnerBillingWriteNotifications extends ApiObject { [key: string]: unknown; }

export interface Cdr extends ApiObject { id?: number; operatorId?: number; platformId?: number; protocolType?: string; sessionId?: number; roamingSessionId?: string; receivedAt?: string; startTime?: string; endTime?: string; }
export interface Invoice extends ApiObject { id?: number; number?: string; operatorId?: number; paymentStatus?: string; issuedAt?: string; totalAmount?: number; currency?: string; }
export interface InvoiceClient extends ApiObject { [key: string]: unknown; }
export interface InvoiceFiscalization extends ApiObject { [key: string]: unknown; }
export interface InvoiceFiscalizationDocument extends ApiObject { [key: string]: unknown; }
export interface Receipt extends ApiObject { id?: number; operatorId?: number; userId?: number; paymentStatus?: string; issuedAt?: string; totalAmount?: number; currency?: string; }
export interface ReceiptTax extends ApiObject { [key: string]: unknown; }
export interface Subscription extends ApiObject { id?: number; planId?: number; userId?: number; status?: string; startedAt?: string; endedAt?: string; }
export interface SubscriptionRemainingAllowance extends ApiObject { [key: string]: unknown; }

export interface RoamingOperator extends ApiObject { id?: number; operatorId?: number; name?: string; settings?: RoamingOperatorSettings; }
export interface RoamingOperatorSettings extends ApiObject { [key: string]: unknown; }
export interface RoamingOperatorWrite extends ApiObject { name?: string; settings?: RoamingOperatorSettings; }
export interface RoamingConnection extends ApiObject { id?: number; roamingOperatorId?: number; protocol?: string; credentials?: RoamingOcpiCredentials; }
export interface RoamingOcpiCredentials extends ApiObject { [key: string]: unknown; }

/** Common AMPECO value sets. Fields deliberately remain `string` for forward compatibility. */
export const ValueSets = {
  ChargePointType: { Private: "private", Public: "public", Personal: "personal" },
  ChargePointStatus: { Enabled: "enabled", Disabled: "disabled", OutOfOrder: "out of order", Demo: "demo" },
  ChargePointNetworkStatus: { NeverConnected: "never_connected", Available: "available", TemporarilyUnavailable: "temporarily_unavailable", LongTermUnavailable: "long-term_unavailable" },
  EvseStatus: { Enabled: "enabled", Disabled: "disabled", OutOfOrder: "out of order" },
  EvseHardwareStatus: { Available: "available", Preparing: "preparing", Charging: "charging", SuspendedEv: "suspendedEV", SuspendedEvse: "suspendedEVSE", Finishing: "finishing", Reserved: "reserved", Unavailable: "unavailable", Faulted: "faulted" },
  CurrentType: { Ac: "ac", Dc: "dc" },
  UserStatus: { Enabled: "enabled", Disabled: "disabled" },
  SessionStatus: { Unknown: "unknown", Pending: "pending", Active: "active", Finished: "finished", Failed: "failed", Expired: "expired" },
  ReservationStatus: { Active: "active", Expired: "expired", Canceled: "canceled", Done: "done" },
  TransactionStatus: { Pending: "pending", Finalized: "finalized", Failed: "failed", Reversed: "reversed", Refunded: "refunded", Authorized: "authorized", Initialized: "initialized" },
  ResetType: { Soft: "Soft", Hard: "Hard" },
  AvailabilityType: { Inoperative: "Inoperative", Operative: "Operative" },
  PreAuthorizationProcessor: { Worldline: "worldline", Stripe: "stripe" },
} as const;

/** API filters use `filter[field]` query parameters. Date objects are serialized in UTC. */
export type FilterValue = string | number | boolean | Date | readonly (string | number | boolean | Date)[] | Filter | undefined;
export interface Filter { [property: string]: FilterValue; }
export interface ChargePointFilter extends Filter {}
export interface EvseFilter extends Filter {}
export interface LocationFilter extends Filter {}
export interface UserFilter extends Filter {}
export interface SessionFilter extends Filter {}
export interface TransactionFilter extends Filter {}
export interface TariffFilter extends Filter {}
export interface ReservationFilter extends Filter {}
export interface PartnerFilter extends Filter {}
export interface CdrFilter extends Filter {}
export interface InvoiceFilter extends Filter {}
export interface ReceiptFilter extends Filter {}
export interface SubscriptionFilter extends Filter {}
export interface RoamingOperatorFilter extends Filter {}
