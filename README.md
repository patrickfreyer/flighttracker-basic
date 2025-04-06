# FlightTracker Basic

A simple flight tracking application built with Next.js and Three.js. This app allows users to track flights in real-time by entering a flight number and visualizing the current position on a 3D Earth model.

## Features

- 3D Earth visualization using Three.js
- Real-time flight tracking using Aviationstack API
- Responsive user interface with Tailwind CSS
- Simple flight search by flight number
- Flight details panel

## Prerequisites

- Node.js 16.x or higher
- Aviationstack API key (get one at [Aviationstack](https://aviationstack.com/))

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd flighttracker-basic
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory and add your Aviationstack API key:

```
NEXT_PUBLIC_AVIATIONSTACK_API_KEY=your_aviationstack_api_key
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## How to Use

1. Enter a flight number in the search box (e.g., "BA123", "LH456")
2. Click the "Track Flight" button
3. If the flight is found, its position will be displayed on the 3D Earth
4. Flight details will be shown in the panel at the bottom of the screen
5. You can rotate, zoom, and pan the 3D Earth view using your mouse

## Technical Details

- **Next.js**: For server-side rendering and API routes
- **Three.js**: For 3D Earth visualization
- **Aviationstack API**: For real-time flight data
- **Tailwind CSS**: For styling the user interface

## License

This project is licensed under the MIT License.
