'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RouteDataType } from '../types/route';

interface EarthProps {
  flightPosition?: { lat: number; lng: number; alt: number };
  routeData?: RouteDataType | null;
}

// Utility function to calculate route points
function calculateRoutePoints(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  numPoints: number = 200  // Increased for smoother curve
): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  
  // Convert to radians
  const startLat = (start.latitude * Math.PI) / 180;
  const startLng = (start.longitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const endLng = (end.longitude * Math.PI) / 180;
  
  // Calculate fraction step
  const step = 1.0 / (numPoints - 1);
  
  // Create points along the route
  for (let i = 0; i < numPoints; i++) {
    const fraction = i * step;
    
    // Calculate the great circle path
    const A = Math.sin((1 - fraction) * Math.PI) / Math.sin(Math.PI);
    const B = Math.sin(fraction * Math.PI) / Math.sin(Math.PI);
    
    const x = A * Math.cos(startLat) * Math.cos(startLng) + B * Math.cos(endLat) * Math.cos(endLng);
    const y = A * Math.cos(startLat) * Math.sin(startLng) + B * Math.cos(endLat) * Math.sin(endLng);
    const z = A * Math.sin(startLat) + B * Math.sin(endLat);
    
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
    const lng = Math.atan2(y, x) * 180 / Math.PI;
    
    points.push({ lat, lng });
  }
  
  return points;
}

const Earth = ({ flightPosition, routeData }: EarthProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const flightMarkerRef = useRef<THREE.Object3D | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const planeModelRef = useRef<THREE.Object3D | null>(null);
  const routeLineRef = useRef<THREE.Line | null>(null);
  const departureMarkerRef = useRef<THREE.Mesh | null>(null);
  const arrivalMarkerRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  
  // Calculate route points if route data is available
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  
  useEffect(() => {
    if (routeData) {
      const points = calculateRoutePoints(
        { latitude: routeData.departure.latitude, longitude: routeData.departure.longitude },
        { latitude: routeData.arrival.latitude, longitude: routeData.arrival.longitude },
        200
      );
      setRoutePoints(points);
    }
  }, [routeData]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      65,  // Wider FOV for better view
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    camera.position.y = 1.5;  // Slightly above to look down on Earth
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    mountRef.current.appendChild(renderer.domElement);
    
    // Add starfield background
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });
    
    // Create random stars
    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Earth geometry
    const earthGeometry = new THREE.SphereGeometry(2, 64, 64);  // Higher resolution sphere
    
    // Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/earth_texture.jpg');
    const earthMaterial = new THREE.MeshPhongMaterial({  // PhongMaterial for better lighting
      map: earthTexture,
      specular: 0x333333,
      shininess: 5
    });
    
    // Create Earth mesh
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);
    earthRef.current = earth;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Load the plane model
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/delta_small_plane.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.0015, 0.0015, 0.0015); // Adjusted scale
      planeModelRef.current = model;
      
      // Create flight marker if position is available
      if (flightPosition) {
        addFlightMarker(flightPosition);
      }
    });
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, []);
  
  // Draw or update the route line when route points change
  useEffect(() => {
    if (!sceneRef.current || !routePoints.length) return;
    
    // Remove existing route line if it exists
    if (routeLineRef.current) {
      sceneRef.current.remove(routeLineRef.current);
      routeLineRef.current = null;
    }
    
    // Remove existing airport markers
    if (departureMarkerRef.current) {
      sceneRef.current.remove(departureMarkerRef.current);
      departureMarkerRef.current = null;
    }
    
    if (arrivalMarkerRef.current) {
      sceneRef.current.remove(arrivalMarkerRef.current);
      arrivalMarkerRef.current = null;
    }
    
    // Create a new line for the route
    const points = routePoints.map(point => 
      latLngToVector3(point.lat, point.lng, 2.05)
    );
    
    const routeGeometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create a more attractive route material
    const routeMaterial = new THREE.LineBasicMaterial({
      color: 0x4fc3f7,  // Light blue color
      linewidth: 3,
      opacity: 0.8,
      transparent: true,
    });
    
    const routeLine = new THREE.Line(routeGeometry, routeMaterial);
    sceneRef.current.add(routeLine);
    routeLineRef.current = routeLine;
    
    // Add markers for departure and arrival airports
    if (routeData) {
      // Departure airport marker (green)
      const departurePos = latLngToVector3(
        routeData.departure.latitude, 
        routeData.departure.longitude, 
        2.05
      );
      const depMarkerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
      const depMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0x4CAF50 });
      const depMarker = new THREE.Mesh(depMarkerGeometry, depMarkerMaterial);
      depMarker.position.copy(departurePos);
      sceneRef.current.add(depMarker);
      departureMarkerRef.current = depMarker;
      
      // Arrival airport marker (red)
      const arrivalPos = latLngToVector3(
        routeData.arrival.latitude, 
        routeData.arrival.longitude, 
        2.05
      );
      const arrMarkerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
      const arrMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xF44336 });
      const arrMarker = new THREE.Mesh(arrMarkerGeometry, arrMarkerMaterial);
      arrMarker.position.copy(arrivalPos);
      sceneRef.current.add(arrMarker);
      arrivalMarkerRef.current = arrMarker;
      
      // Start animation
      setIsAnimating(true);
      progressRef.current = 0;
    }
    
    // If we have flight position, position the flight on the route
    if (flightPosition) {
      addFlightMarker(flightPosition);
    }
  }, [routePoints]);
  
  // Animation effect for flying the plane along the route
  useEffect(() => {
    if (!isAnimating || !routePoints.length || !sceneRef.current) return;
    
    let lastTime = 0;
    const animationSpeed = 0.1; // Adjust for faster/slower animation
    
    const animate = (time: number) => {
      if (lastTime === 0) lastTime = time;
      const deltaTime = time - lastTime;
      lastTime = time;
      
      // Update progress
      progressRef.current += (deltaTime * animationSpeed) / 1000;
      if (progressRef.current > 1) progressRef.current = 0;
      
      // Get the current position on the route
      const index = Math.floor(progressRef.current * (routePoints.length - 1));
      const point = routePoints[index];
      const nextIndex = Math.min(index + 1, routePoints.length - 1);
      const nextPoint = routePoints[nextIndex];
      
      // Create a position that looks like it's following the route
      const position = {
        lat: point.lat,
        lng: point.lng,
        alt: 0
      };
      
      // Get the bearing to the next point
      const bearing = calculateBearing(point.lat, point.lng, nextPoint.lat, nextPoint.lng);
      
      // Update the flight marker position
      if (planeModelRef.current) {
        updateFlightMarkerPosition(position, bearing);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, routePoints]);
  
  // Helper function to update flight marker position during animation
  const updateFlightMarkerPosition = (position: { lat: number; lng: number; alt: number }, bearing: number) => {
    // If we don't have the plane model loaded yet, wait
    if (!planeModelRef.current || !sceneRef.current) return;
    
    // Remove existing flight marker if it exists
    if (flightMarkerRef.current) {
      sceneRef.current.remove(flightMarkerRef.current);
    }
    
    // Clone the plane model to use as our marker
    const planeMarker = planeModelRef.current.clone();
    
    // Position the marker on the globe
    const radius = 2.1; // Earth radius + small offset
    const markerPosition = latLngToVector3(position.lat, position.lng, radius);
    planeMarker.position.copy(markerPosition);
    
    // Calculate normal (up) vector from center of earth to position
    const up = new THREE.Vector3().subVectors(markerPosition, new THREE.Vector3(0, 0, 0)).normalize();
    
    // Calculate East vector (perpendicular to Up and aligned with global Y)
    const east = new THREE.Vector3(-up.z, 0, up.x).normalize();
    
    // Calculate North vector (perpendicular to Up and East)
    const north = new THREE.Vector3().crossVectors(up, east).normalize();
    
    // Create rotation matrix
    const rotationMatrix = new THREE.Matrix4().makeBasis(east, up, north);
    planeMarker.setRotationFromMatrix(rotationMatrix);
    
    // Apply bearing rotation to align with flight path
    const bearingRadians = (bearing * Math.PI) / 180;
    planeMarker.rotateOnWorldAxis(up, bearingRadians);
    
    // Adjust model orientation to point forward along the path
    planeMarker.rotateX(Math.PI / 2);
    
    // Add marker to scene
    sceneRef.current.add(planeMarker);
    flightMarkerRef.current = planeMarker;
  };
  
  // Helper function to calculate bearing between two points
  const calculateBearing = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    // Convert to radians
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lon1Rad = (lon1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const lon2Rad = (lon2 * Math.PI) / 180;
    
    // Calculate the bearing
    const y = Math.sin(lon2Rad - lon1Rad) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad);
    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    
    // Normalize to 0-360
    bearing = (bearing + 360) % 360;
    
    return bearing;
  };
  
  // Helper function to add or update flight marker when flight position changes
  useEffect(() => {
    if (flightPosition && sceneRef.current) {
      addFlightMarker(flightPosition);
    }
  }, [flightPosition]);
  
  // Helper function to convert lat/lng to 3D coordinates
  const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
    // Convert latitude and longitude to radians
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    // Calculate 3D position
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
  };

  // Helper function to find nearest point on route and get bearing
  const findNearestRoutePointAndBearing = (position: { lat: number; lng: number }) => {
    if (!routePoints.length) return null;
    
    // Find nearest point on route
    let minDistance = Number.MAX_VALUE;
    let nearestPointIndex = 0;
    
    routePoints.forEach((point, index) => {
      const distance = Math.sqrt(
        Math.pow(point.lat - position.lat, 2) + 
        Math.pow(point.lng - position.lng, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestPointIndex = index;
      }
    });
    
    // Get next point on route for bearing calculation
    const nextPointIndex = Math.min(nearestPointIndex + 1, routePoints.length - 1);
    
    // If we're at the last point, use the previous point as reference
    if (nextPointIndex === nearestPointIndex && routePoints.length > 1) {
      nearestPointIndex = routePoints.length - 2;
    }
    
    const currentPoint = routePoints[nearestPointIndex];
    const nextPoint = routePoints[nextPointIndex];
    
    // Calculate bearing between the two points (only if they're different points)
    if (nextPointIndex === nearestPointIndex) {
      return {
        point: currentPoint,
        bearing: 0 // Default bearing
      };
    }
    
    const y = Math.sin(nextPoint.lng * Math.PI/180 - currentPoint.lng * Math.PI/180) * 
              Math.cos(nextPoint.lat * Math.PI/180);
    const x = Math.cos(currentPoint.lat * Math.PI/180) * Math.sin(nextPoint.lat * Math.PI/180) -
              Math.sin(currentPoint.lat * Math.PI/180) * Math.cos(nextPoint.lat * Math.PI/180) * 
              Math.cos(nextPoint.lng * Math.PI/180 - currentPoint.lng * Math.PI/180);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    
    return {
      point: currentPoint,
      bearing: (bearing + 360) % 360
    };
  };
  
  // Add flight marker to the scene
  const addFlightMarker = (position: { lat: number; lng: number; alt: number }) => {
    // Remove existing flight marker if it exists
    if (flightMarkerRef.current && sceneRef.current) {
      sceneRef.current.remove(flightMarkerRef.current);
    }
    
    // If we don't have the plane model loaded yet, wait
    if (!planeModelRef.current) return;
    
    // Clone the plane model to use as our marker
    const planeMarker = planeModelRef.current.clone();
    
    // Position the marker on the globe
    const radius = 2.1; // Earth radius + small offset
    
    // Get nearest point on route if available
    let markerPosition;
    const routeInfo = routePoints.length ? findNearestRoutePointAndBearing(position) : null;
    
    if (routeInfo) {
      // Use the route point for positioning if available
      markerPosition = latLngToVector3(routeInfo.point.lat, routeInfo.point.lng, radius);
    } else {
      // Fallback to raw position
      markerPosition = latLngToVector3(position.lat, position.lng, radius);
    }
    
    planeMarker.position.copy(markerPosition);
    
    // Set orientation for the plane
    if (routeInfo) {
      // Calculate normal (up) vector from center of earth to position
      const up = new THREE.Vector3().subVectors(markerPosition, new THREE.Vector3(0, 0, 0)).normalize();
      
      // Calculate East vector (perpendicular to Up and aligned with global Y)
      const east = new THREE.Vector3(-up.z, 0, up.x).normalize();
      
      // Calculate North vector (perpendicular to Up and East)
      const north = new THREE.Vector3().crossVectors(up, east).normalize();
      
      // Create rotation matrix
      const rotationMatrix = new THREE.Matrix4().makeBasis(east, up, north);
      planeMarker.setRotationFromMatrix(rotationMatrix);
      
      // Apply bearing rotation to align with flight path
      const bearingRadians = (routeInfo.bearing * Math.PI) / 180;
      planeMarker.rotateOnWorldAxis(up, bearingRadians);
      
      // Adjust model orientation to point forward along the path
      planeMarker.rotateX(Math.PI / 2);
    } else {
      // Fallback orientation method when route is not available
      const up = new THREE.Vector3().subVectors(markerPosition, new THREE.Vector3(0, 0, 0)).normalize();
      const east = new THREE.Vector3(-up.z, 0, up.x).normalize();
      const north = new THREE.Vector3().crossVectors(up, east).normalize();
      
      const rotationMatrix = new THREE.Matrix4().makeBasis(east, up, north);
      planeMarker.setRotationFromMatrix(rotationMatrix);
      
      // Apply default orientation
      planeMarker.rotateY(Math.PI / 2);
    }
    
    // Add marker to scene
    if (sceneRef.current) {
      sceneRef.current.add(planeMarker);
      flightMarkerRef.current = planeMarker;
    }
  };
  
  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
};

export default Earth; 