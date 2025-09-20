export enum AmenityType {
  HOTEL = 'HOTEL',
  ROOM = 'ROOM'
}

export interface Amenity {
  amenity_id: number;
  name: string;
  image: string;
  type: AmenityType;
}
