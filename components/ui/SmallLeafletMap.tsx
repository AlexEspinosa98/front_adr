"use client";

import { Icon, type LatLngExpression } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useMemo } from "react";

type SmallLeafletMapProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
};

const DEFAULT_MARKER_ICON = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const SmallLeafletMap = ({
  latitude,
  longitude,
  zoom = 16,
}: SmallLeafletMapProps) => {
  const position = useMemo<LatLngExpression>(
    () => [latitude, longitude],
    [latitude, longitude],
  );

  return (
    <MapContainer
      center={position}
      zoom={zoom}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={DEFAULT_MARKER_ICON}>
        <Popup>Ubicacion GPS del predio</Popup>
      </Marker>
    </MapContainer>
  );
};
