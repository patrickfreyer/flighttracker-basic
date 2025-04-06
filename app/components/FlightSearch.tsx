'use client';

import { useState } from 'react';

interface FlightSearchProps {
  onFlightData: (flightData: any) => void;
  isLoading: boolean;
  error: string | null;
}

const FlightSearch = ({ onFlightData, isLoading, error }: FlightSearchProps) => {
  const [flightNumber, setFlightNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!flightNumber.trim()) return;
    
    try {
      // Make API call to your backend route
      const response = await fetch(`/api/flight?flight_number=${flightNumber.trim()}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      onFlightData(data);
    } catch (err: any) {
      console.error('Error fetching flight data:', err);
    }
  };

  return (
    <div className="absolute top-0 left-0 p-4 bg-black/50 text-white rounded-br-lg z-10">
      <h2 className="text-xl font-bold mb-2">Flight Tracker</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div>
          <input
            type="text"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            placeholder="Enter flight number (e.g., BA123)"
            className="w-full p-2 bg-gray-800 text-white rounded"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter airline code + flight number without spaces (e.g., BA123, LH456)
          </p>
          <p className="text-xs text-gray-400">
            Format must be letters followed by numbers (e.g., AA123)
          </p>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Track Flight'}
        </button>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
};

export default FlightSearch; 