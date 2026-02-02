import * as movininTypes from ':movinin-types'

const getId = (value?: movininTypes.User | movininTypes.Development | string): string | undefined => {
  if (!value) {
    return undefined
  }
  return typeof value === 'string' ? value : value._id
}

export const buildUpdatePayload = (
  property: movininTypes.Property,
  overrides?: Partial<movininTypes.UpdatePropertyPayload>,
): movininTypes.UpdatePropertyPayload => {
  return {
    _id: property._id,
    name: property.name,
    agency: getId(property.agency) as string,
    broker: getId(property.broker),
    developer: getId(property.developer),
    owner: getId(property.owner),
    developmentId: getId(property.developmentId as unknown as movininTypes.Development),
    type: property.type,
    description: property.description,
    image: property.image,
    images: property.images || [],
    available: property.available,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    kitchens: property.kitchens,
    parkingSpaces: property.parkingSpaces,
    size: property.size,
    petsAllowed: property.petsAllowed,
    furnished: property.furnished,
    aircon: property.aircon,
    minimumAge: property.minimumAge,
    location: property.location?._id as string,
    address: property.address || '',
    latitude: property.latitude,
    longitude: property.longitude,
    price: property.price,
    salePrice: property.salePrice ?? null,
    hidden: property.hidden,
    cancellation: property.cancellation,
    rentalTerm: property.rentalTerm,
    listingType: property.listingType,
    listingStatus: property.listingStatus,
    seoTitle: property.seoTitle,
    seoDescription: property.seoDescription,
    seoKeywords: property.seoKeywords,
    seoGeneratedAt: property.seoGeneratedAt,
    blockOnPay: property.blockOnPay,
    ...overrides,
  }
}
