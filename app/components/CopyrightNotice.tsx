'use client';

import { useState } from 'react';

const CopyrightNotice = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center focus:outline-none"
        aria-label="Copyright information"
      >
        <span className="italic font-serif">i</span>
      </button>
      
      {isOpen && (
        <div 
          className="absolute bottom-10 right-0 bg-gray-800 text-white p-4 rounded-lg shadow-lg text-xs"
          style={{ width: '320px' }}
        >
          <p className="mb-2">
            Very cute airplane by Akash Rudra{' '}
            <a 
              href="https://creativecommons.org/licenses/by/3.0/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:underline"
            >
              [CC-BY]
            </a>
          </p>
          <p>
            via{' '}
            <a 
              href="https://poly.pizza/m/3UtIosDm9u-" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:underline"
            >
              Poly Pizza
            </a>
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-1 right-1 text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default CopyrightNotice; 