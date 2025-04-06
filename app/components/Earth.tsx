'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface EarthProps {
  flightPosition?: { lat: number; lng: number; alt: number };
}

const Earth = ({ flightPosition }: EarthProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const flightMarkerRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    mountRef.current.appendChild(renderer.domElement);
    
    // Earth geometry
    const earthGeometry = new THREE.SphereGeometry(2, 32, 32);
    
    // Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/earth_texture.jpg');
    const earthMaterial = new THREE.MeshBasicMaterial({ 
      map: earthTexture 
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
    
    // Create flight marker
    if (flightPosition) {
      addFlightMarker(flightPosition);
    }
    
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
  
  // Function to add or update flight marker when flight position changes
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
  
  // Add flight marker to the scene
  const addFlightMarker = (position: { lat: number; lng: number; alt: number }) => {
    // Remove existing flight marker if it exists
    if (flightMarkerRef.current && sceneRef.current) {
      sceneRef.current.remove(flightMarkerRef.current);
    }
    
    // Create a new flight marker (simple cube)
    const markerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Position the marker on the globe
    // Add a small offset from the Earth's surface
    const radius = 2.05; // Earth radius + small offset
    const markerPosition = latLngToVector3(position.lat, position.lng, radius);
    marker.position.copy(markerPosition);
    
    // Add marker to scene
    if (sceneRef.current) {
      sceneRef.current.add(marker);
      flightMarkerRef.current = marker;
    }
  };
  
  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
};

export default Earth; 