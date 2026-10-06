export type GeoCoordinates = {
  latitude: number
  longitude: number
}

export const UIU_CAMPUS: GeoCoordinates = {
  latitude: 23.7989022,
  longitude: 90.4495995,
}

export function parseUiuCoordinates(latitude: unknown, longitude: unknown): GeoCoordinates | undefined {
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined

  // Rental listings are local to UIU; reject legacy percentage-based pins
  // rather than accidentally placing them at unrelated world locations.
  if (lat < 23.5 || lat > 24.2 || lng < 90 || lng > 91) return undefined
  return { latitude: lat, longitude: lng }
}

export function distanceFromCampusKm(location: GeoCoordinates): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const earthRadiusKm = 6371
  const latitudeDelta = radians(location.latitude - UIU_CAMPUS.latitude)
  const longitudeDelta = radians(location.longitude - UIU_CAMPUS.longitude)
  const campusLatitude = radians(UIU_CAMPUS.latitude)
  const locationLatitude = radians(location.latitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(campusLatitude) * Math.cos(locationLatitude) * Math.sin(longitudeDelta / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}
