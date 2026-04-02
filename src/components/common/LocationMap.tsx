"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface LocationMapProps {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

export default function LocationMap({ latitude, longitude, radiusMeters }: LocationMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={17}
      scrollWheelZoom={false}
      className="w-full h-[300px] rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={markerIcon} />
      {radiusMeters && (
        <Circle
          center={[latitude, longitude]}
          radius={radiusMeters}
          pathOptions={{ color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 0.12, weight: 2 }}
        />
      )}
      <RecenterMap lat={latitude} lng={longitude} />
    </MapContainer>
  );
}
