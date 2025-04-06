export type RouteDataType = {
  departure: {
    code: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  arrival: {
    code: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  distance?: number;
  bearing?: number;
}; 