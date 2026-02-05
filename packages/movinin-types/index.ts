export enum UserType {
  Admin = 'ADMIN',
  Broker = 'BROKER',
  Developer = 'DEVELOPER',
  Owner = 'OWNER',
  Agency = 'AGENCY',
  User = 'USER',
}

export enum OrganizationType {
  Brokerage = 'BROKERAGE',
  Developer = 'DEVELOPER',
}

export enum OrgMemberRole {
  OwnerAdmin = 'OWNER_ADMIN',
  Admin = 'ADMIN',
  Manager = 'MANAGER',
  Agent = 'AGENT',
  Accounting = 'ACCOUNTING',
  Marketing = 'MARKETING',
}

export enum OrgMemberStatus {
  Invited = 'INVITED',
  Active = 'ACTIVE',
  Removed = 'REMOVED',
}

export enum OrgPartnershipStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
}

export enum AppType {
  Admin = 'ADMIN',
  Frontend = 'FRONTEND',
}

export enum ListingType {
  Rent = 'RENT',
  Sale = 'SALE',
  Both = 'BOTH',
}

export enum ListingStatus {
  Draft = 'DRAFT',
  PendingReview = 'PENDING_REVIEW',
  Published = 'PUBLISHED',
  Rejected = 'REJECTED',
  Archived = 'ARCHIVED',
}

export enum LeadStatus {
  New = 'NEW',
  Contacted = 'CONTACTED',
  ViewingScheduled = 'VIEWING_SCHEDULED',
  ClosedWon = 'CLOSED_WON',
  ClosedLost = 'CLOSED_LOST',
}

export enum RfqStatus {
  New = 'NEW',
  Contacted = 'CONTACTED',
  ClosedWon = 'CLOSED_WON',
  ClosedLost = 'CLOSED_LOST',
}

export enum NotificationType {
  General = 'GENERAL',
  Message = 'MESSAGE',
}

export enum MessageThreadType {
  Direct = 'DIRECT',
  Group = 'GROUP',
  Broadcast = 'BROADCAST',
}

export enum DevelopmentStatus {
  Planning = 'PLANNING',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
}

export enum PropertyType {
  Apartment = 'APARTMENT',
  Commercial = 'COMMERCIAL',
  Farm = 'FARM',
  House = 'HOUSE',
  Industrial = 'INDUSTRIAL',
  Plot = 'PLOT',
  Townhouse = 'TOWNHOUSE',
}

export enum BookingStatus {
  Void = 'VOID',
  Pending = 'PENDING',
  Deposit = 'DEPOSIT',
  Paid = 'PAID',
  Reserved = 'RESERVED',
  Cancelled = 'CANCELLED',
}

export enum RecordType {
  Admin = 'ADMIN',
  Broker = 'BROKER',
  Developer = 'DEVELOPER',
  Owner = 'OWNER',
  Agency = 'AGENCY',
  User = 'USER',
  Organization = 'ORGANIZATION',
  OrgMembership = 'ORG_MEMBERSHIP',
  OrgPartnership = 'ORG_PARTNERSHIP',
  Property = 'PROPERTY',
  Location = 'LOCATION',
  Country = 'COUNTRY',
  Development = 'DEVELOPMENT',
  Lead = 'LEAD',
  Rfq = 'RFQ',
}

export enum Availablity {
  Available = 'AVAILABLE',
  Unavailable = 'UNAVAILABLE',
}

export enum RentalTerm {
  Monthly = 'MONTHLY',
  Weekly = 'WEEKLY',
  Daily = 'DAILY',
  Yearly = 'YEARLY',
}

export enum PaymentGateway {
  PayPal = 'payPal',
  Stripe = 'stripe',
}

export interface SignUpPayload {
  email: string
  password: string
  fullName: string
  language: string
  active?: boolean
  verified?: boolean
  approved?: boolean
  blacklisted?: boolean
  type?: string
  avatar?: string
  birthDate?: number | Date
  phone?: string
  company?: string
  licenseId?: string
  serviceAreas?: string[]
  website?: string
  onboardingCompleted?: boolean
}

export interface CreateUserPayload {
  email?: string
  phone: string
  location: string
  bio: string
  fullName: string
  type?: string
  avatar?: string
  birthDate?: number | Date
  language?: string
  agency?: string
  primaryOrg?: string
  orgRole?: string
  password?: string
  verified?: boolean
  approved?: boolean
  blacklisted?: boolean
  payLater?: boolean
  company?: string
  licenseId?: string
  serviceAreas?: string[]
  website?: string
  onboardingCompleted?: boolean
}

export interface UpdateUserPayload extends CreateUserPayload {
  _id: string
  enableEmailNotifications?: boolean
  payLater?: boolean
}

export interface changePasswordPayload {
  _id: string
  password: string
  newPassword: string
  strict: boolean
}

export interface UpdateAgencyPayload {
  _id: string
  fullName: string
  phone: string
  location: string
  bio: string
  payLater: boolean
  blacklisted?: boolean
}

export interface UpdateStatusPayload {
  ids: string[]
  status: string
}

export interface Renter {
  _id?: string
  email: string
  phone: string
  fullName: string
  birthDate: string
  language: string
  verified: boolean
  blacklisted: boolean
}

export interface Booking {
  _id?: string
  agency: string | User
  property: string | Property
  renter?: string | User
  from: Date
  to: Date
  status: BookingStatus
  cancellation: boolean
  price?: number
  location: string | Location
  cancelRequest?: boolean
  sessionId?: string
  paymentIntentId?: string
  customerId?: string
  expireAt?: Date
  paypalOrderId?: string
}

export interface CheckoutPayload {
  renter?: User
  booking?: Booking
  payLater?: boolean
  sessionId?: string
  paymentIntentId?: string
  customerId?: string
  payPal?: boolean
}

export interface Filter {
  from?: Date
  dateBetween?: Date
  to?: Date
  location?: string
  keyword?: string
}

export interface GetBookingsPayload {
  agencies: string[]
  statuses: string[]
  user?: string
  property?: string
  filter?: Filter
  language?: string
}

export interface LocationName {
  language: string
  name: string
}

export interface CountryName {
  language: string
  name: string
}

export interface UpsertLocationPayload {
  country: string
  longitude?: number
  latitude?: number
  names: LocationName[]
  image?: string | null
  parentLocation?: string
}


export interface ActivatePayload {
  userId: string
  token: string
  password: string
}

export interface ValidateEmailPayload {
  email: string
}

export enum SocialSignInType {
  Facebook = 'facebook',
  Apple = 'apple',
  Google = 'google'
}

export interface SignInPayload {
  email?: string
  password?: string
  stayConnected?: boolean
  mobile?: boolean
  fullName?: string
  avatar?: string
  accessToken?: string
  socialSignInType?: SocialSignInType
}

export interface ResendLinkPayload {
  email?: string
}

export interface UpdateLanguage {
  id: string
  language: string
}

export interface ValidateAgencyPayload {
  fullName: string
}

export interface ValidateLocationPayload {
  language: string
  name: string
}

export interface ValidateCountryPayload {
  language: string
  name: string
}

export interface GetBookingPropertiesPayload {
  agency: string
  location: string
}

export interface User {
  _id?: string
  agency?: User | string
  primaryOrg?: Organization | string
  orgRole?: string
  fullName: string
  email?: string
  phone?: string
  password?: string
  birthDate?: Date
  verified?: boolean
  verifiedAt?: Date
  approved?: boolean
  active?: boolean
  language?: string
  enableEmailNotifications?: boolean
  avatar?: string
  bio?: string
  location?: string
  type?: string
  blacklisted?: boolean
  payLater?: boolean
  accessToken?: string
  checked?: boolean
  customerId?: string
  company?: string
  licenseId?: string
  serviceAreas?: string[]
  website?: string
  onboardingCompleted?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Organization {
  _id?: string
  name: string
  slug?: string
  type: OrganizationType
  description?: string
  logo?: string
  cover?: string
  email?: string
  phone?: string
  website?: string
  location?: string
  serviceAreas?: string[]
  verified?: boolean
  approved?: boolean
  active?: boolean
  createdBy?: User | string
  seats?: number
  plan?: string
  expiresAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateOrganizationPayload {
  name: string
  slug?: string
  type: OrganizationType
  description?: string
  logo?: string
  cover?: string
  email?: string
  phone?: string
  website?: string
  location?: string
  serviceAreas?: string[]
  verified?: boolean
  approved?: boolean
  active?: boolean
  createdBy?: string
  seats?: number
  plan?: string
  expiresAt?: Date
}

export interface UpdateOrganizationPayload extends CreateOrganizationPayload {
  _id: string
}

export interface InviteOrgMemberPayload {
  org: string
  email: string
  fullName: string
  role: OrgMemberRole
  title?: string
  phone?: string
  language?: string
}

export interface OrgMembership {
  _id?: string
  org: Organization | string
  user: User | string
  role: OrgMemberRole
  title?: string
  status: OrgMemberStatus
  invitedBy?: User | string
  invitedAt?: Date
  acceptedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface OrgPartnership {
  _id?: string
  brokerOrg: Organization | string
  developerOrg: Organization | string
  status: OrgPartnershipStatus
  message?: string
  requestedBy?: User | string
  reviewedBy?: User | string
  reviewedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateOrgPartnershipPayload {
  brokerOrg?: string
  developerOrg: string
  message?: string
}

export interface UpdateOrgPartnershipPayload {
  _id: string
  status: OrgPartnershipStatus
}

export interface CreateOrgMembershipPayload {
  org: string
  user: string
  role: OrgMemberRole
  title?: string
  status?: OrgMemberStatus
  invitedBy?: string
}

export interface UpdateOrgMembershipPayload extends CreateOrgMembershipPayload {
  _id: string
}

export interface Option {
  _id: string
  name?: string
  image?: string
}

export interface LocationValue {
  language: string
  value?: string
  name?: string
}

export interface Location {
  _id: string
  country?: Country
  longitude?: number
  latitude?: number
  name?: string
  values?: LocationValue[]
  image?: string
  parentLocation?: Location
}

export interface Country {
  _id: string
  name?: string
  values?: LocationValue[]
}

export interface CountryInfo extends Country {
  locations?: Location[]
}

export interface Property {
  _id: string
  name: string
  type: PropertyType
  agency: User
  broker?: User | string
  developer?: User | string
  owner?: User | string
  brokerageOrg?: Organization | string
  developerOrg?: Organization | string
  developmentId?: string
  description: string
  aiDescription?: string
  useAiDescription?: boolean
  available: boolean
  image: string
  images?: string[]
  bedrooms: number
  bathrooms: number
  kitchens: number
  parkingSpaces: number
  size?: number
  petsAllowed: boolean
  furnished: boolean
  aircon: boolean
  minimumAge: number
  location: Location
  address?: string
  latitude?: number
  longitude?: number
  price: number
  salePrice?: number | null
  hidden: boolean
  cancellation: number
  rentalTerm: RentalTerm
  listingType?: ListingType
  listingStatus?: ListingStatus
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  seoGeneratedAt?: Date
  reviewedBy?: User | string
  reviewedAt?: Date
  reviewNotes?: string
  blockOnPay?: boolean
  [propKey: string]: any
}

export interface CreatePropertyPayload {
  name: string
  agency: string
  type: string
  description: string
  aiDescription?: string
  useAiDescription?: boolean
  image: string
  images?: string[]
  available: boolean
  bedrooms: number
  bathrooms: number
  kitchens: number
  parkingSpaces: number
  size?: number
  petsAllowed: boolean
  furnished: boolean
  aircon: boolean
  minimumAge: number
  location?: string
  address: string
  latitude?: number
  longitude?: number
  price: number
  salePrice?: number | null
  hidden: boolean
  cancellation: number
  rentalTerm: string
  listingType?: string
  listingStatus?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  seoGeneratedAt?: Date
  broker?: string
  developer?: string
  owner?: string
  brokerageOrg?: string
  developerOrg?: string
  developmentId?: string
  reviewedBy?: string
  reviewedAt?: Date
  reviewNotes?: string
  blockOnPay?: boolean
}

export interface UpdatePropertyPayload extends CreatePropertyPayload {
  _id: string
}

export interface SeoGeneratePayload {
  name: string
  type: string
  description: string
  location?: string
  bedrooms?: number
  bathrooms?: number
  size?: number
  listingType?: string
  price?: number
  salePrice?: number | null
  rentalTerm?: string
  kitchens?: number
  parkingSpaces?: number
  petsAllowed?: boolean
  furnished?: boolean
  aircon?: boolean
}

export interface SeoGenerateResult {
  seoTitle: string
  seoDescription: string
  seoKeywords: string[]
  aiDescription?: string
}

export interface Development {
  _id?: string
  name: string
  description?: string
  location?: string
  developer: User | string
  developerOrg?: Organization | string
  unitsCount?: number
  status?: DevelopmentStatus
  approved?: boolean
  images?: string[]
  masterPlan?: string
  floorPlans?: string[]
  latitude?: number
  longitude?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateDevelopmentPayload {
  name: string
  description?: string
  location?: string
  developer: string
  developerOrg?: string
  unitsCount?: number
  status?: DevelopmentStatus
  approved?: boolean
  images?: string[]
  masterPlan?: string
  floorPlans?: string[]
  latitude?: number
  longitude?: number
}

export interface UpdateDevelopmentPayload extends CreateDevelopmentPayload {
  _id: string
}

export interface Lead {
  _id?: string
  property?: Property | string
  listingType?: ListingType
  name: string
  email?: string
  phone?: string
  message?: string
  assignedTo?: User | string
  status: LeadStatus
  source?: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface RfqRequest {
  _id?: string
  name: string
  email?: string
  phone?: string
  location?: string
  listingType?: ListingType
  propertyType?: PropertyType
  bedrooms?: number
  bathrooms?: number
  budget?: number
  message?: string
  status?: RfqStatus
  assignedTo?: User | string
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateRfqPayload {
  name: string
  email?: string
  phone?: string
  location?: string
  listingType?: ListingType
  propertyType?: PropertyType
  bedrooms?: number
  bathrooms?: number
  budget?: number
  message?: string
}

export interface UpdateRfqPayload {
  _id: string
  status?: RfqStatus
  assignedTo?: string
  message?: string
}

export interface CreateLeadPayload {
  property?: string
  listingType?: ListingType
  name: string
  email?: string
  phone?: string
  message?: string
  source?: string
}

export interface UpdateLeadPayload {
  _id: string
  status?: LeadStatus
  assignedTo?: string
  notes?: string
}

export interface Notification {
  _id: string
  user: string
  message: string
  booking?: string
  link?: string
  type?: NotificationType
  isRead?: boolean
  checked?: boolean
  createdAt?: Date
}

export interface NotificationCounter {
  _id: string
  user: string
  count: number
  messageCount?: number
}

export interface ResultData<T> {
  pageInfo: { totalRecords: number }
  resultData: T[]
}

export type Result<T> = [ResultData<T>] | [] | undefined | null

export interface Data<T> {
  rows: T[]
  rowCount: number
}

export interface ChangePasswordPayload {
  _id: string
  password: string
  newPassword: string
  strict: boolean
}

export interface UpdateEmailNotificationsPayload {
  _id: string
  enableEmailNotifications: boolean
}

export interface GetPropertiesPayload {
  agencies: string[]
  types?: PropertyType[]
  rentalTerms?: RentalTerm[]
  listingTypes?: ListingType[]
  listingStatuses?: ListingStatus[]
  brokers?: string[]
  developers?: string[]
  owners?: string[]
  brokerageOrgs?: string[]
  developerOrgs?: string[]
  availability?: Availablity[]
  location?: string
  language?: string
  from?: Date
  to?: Date
}

export interface Message {
  _id?: string
  thread?: MessageThread | string
  threadId?: string
  type?: MessageThreadType
  title?: string
  property?: Property | string
  sender: User | string
  recipient?: User | string
  message: string
  createdAt?: Date
}

export interface CreateMessagePayload {
  threadId?: string
  property?: string
  recipient?: string
  message: string
}

export interface MessageThread {
  _id?: string
  type?: MessageThreadType
  title?: string
  property?: Property | string
  participants?: Array<User | string>
  developerOrg?: Organization | string
  brokerageOrg?: Organization | string
  lastMessage?: Message
  otherUser?: User
  updatedAt?: Date
  lastMessageAt?: Date
}

export interface CreateMessageThreadPayload {
  title: string
  participants: string[]
  orgId?: string
}

export interface BroadcastMessagePayload {
  developerOrg?: string
  title?: string
  message: string
}

export interface UpdateLanguagePayload {
  id: string
  language: string
}

export interface GetUsersBody {
  user: string
  types: UserType[]
}

export interface GetLeadsPayload {
  statuses?: LeadStatus[]
  assignedTo?: string
  property?: string
  listingType?: ListingType
  keyword?: string
}

export interface GetDevelopmentsPayload {
  developer?: string
  developers?: string[]
  developerOrgs?: string[]
  status?: DevelopmentStatus
  keyword?: string
  location?: string
}

export interface GetOrgPartnershipsPayload {
  orgId: string
}

export interface PropertyOptions {
  cancellation?: boolean
}

export interface CreatePaymentPayload {
  amount: number
  /**
   * Three-letter ISO currency code, in lowercase.
   * Must be a supported currency: https://docs.stripe.com/currencies
   *
   * @type {string}
   */
  currency: string
  /**
   * The IETF language tag of the locale Checkout is displayed in. If blank or auto, the browser's locale is used.
   *
   * @type {string}
   */
  locale: string
  receiptEmail: string
  customerName: string
  name: string
  description?: string
}

export interface CreatePayPalOrderPayload {
  bookingId: string
  amount: number
  currency: string
  name: string
  description: string
}

export interface PaymentResult {
  sessionId?: string
  paymentIntentId?: string
  customerId: string
  clientSecret: string | null
}

export interface SendEmailPayload {
  from: string
  to: string
  subject: string
  message: string
  isContactForm: boolean
}

// 
// React types
//
export type DataEvent<T> = (data?: Data<T>) => void

export interface StatusFilterItem {
  label: string
  value: BookingStatus
  checked?: boolean
}

export interface PropertyFilter {
  location: Location
  from?: Date
  to?: Date
}

export type PropertyFilterSubmitEvent = (filter: PropertyFilter) => void
