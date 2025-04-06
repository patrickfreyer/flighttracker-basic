'use client';

import { useState } from 'react';
import Earth from './components/Earth';
import FlightSearch from './components/FlightSearch';

export default function Home() {
  const [flightData, setFlightData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFlightData = (data: any) => {
    setFlightData(data);
    setIsLoading(false);
    setError(null);
  };

  const handleSearch = async (flightNumber: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/flight?flight_number=${flightNumber}`);
      const data = await response.json();
      
      if (response.ok) {
        handleFlightData(data);
      } else {
        setError(data.error || 'Failed to fetch flight data');
        setFlightData(null);
      }
    } catch (err) {
      setError('An error occurred while fetching flight data');
      setFlightData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* Earth Component */}
      <Earth flightPosition={flightData ? {
        lat: flightData.lat,
        lng: flightData.lng,
        alt: flightData.alt || 0
      } : undefined} />
      
      {/* Flight Search Component */}
      <FlightSearch
        onFlightData={handleFlightData}
        isLoading={isLoading}
        error={error}
      />
      
      {/* Flight Information Panel */}
      {flightData && (
        <div className="absolute bottom-0 left-0 p-4 bg-black/50 text-white rounded-tr-lg z-10 max-w-md">
          <h3 className="text-lg font-bold mb-2">Flight Information</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <p>Flight:</p>
            <p>{flightData.flight_iata || flightData.flight_icao || flightData.flight_number}</p>
            
            <p>Airline:</p>
            <p>{flightData.airline_iata || flightData.airline_icao}</p>
            
            <p>From:</p>
            <p>{flightData.dep_iata || flightData.dep_icao}</p>
            
            <p>To:</p>
            <p>{flightData.arr_iata || flightData.arr_icao}</p>
            
            <p>Status:</p>
            <p className="capitalize">{flightData.status || 'Unknown'}</p>
            
            <p>Speed:</p>
            <p>{flightData.speed ? `${flightData.speed} km/h` : 'Unknown'}</p>
            
            <p>Altitude:</p>
            <p>{flightData.alt ? `${flightData.alt} meters` : 'Unknown'}</p>
            
            <p>Position:</p>
            <p>
              {flightData.lat && flightData.lng 
                ? `${flightData.lat.toFixed(4)}, ${flightData.lng.toFixed(4)}` 
                : 'Unknown'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
