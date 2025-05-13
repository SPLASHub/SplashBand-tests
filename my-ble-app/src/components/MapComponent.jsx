import React, { useEffect, useContext, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getDistance } from "geolib";

import { PositionContext } from "./Contexts";

const security_radius = 30; // raio em metros

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const MapComponent = () => {
  const { bleGPSData, bleConnectionStatus, deviceGPSData } =
    useContext(PositionContext);
  console.log("bleGPSData", bleGPSData);
  console.log("deviceGPSData", deviceGPSData);
  // DEVICE GPS NAO FUNFA BEM, POR ENQUANTO FICA ASSIM PARA NAO PERDER TEMPO VISTO QUE ISTO DEVE ESTAR ARRANJADO
  const [deviceImprov, setDeviceImprov] = useState({
    latitude: 39.6813485, //40.6319694,
    longitude: -8.5204315, //-8.6555032
  });


  if (
    !bleGPSData ||
    typeof bleGPSData.latitude === "undefined" ||
    !deviceGPSData ||
    typeof deviceGPSData.latitude === "undefined"
  ) {
    return <div>Carregando mapa...</div>;
  }
  const distance = getDistance(
    { latitude: bleGPSData.latitude, longitude: bleGPSData.longitude },
    { latitude: deviceImprov.latitude, longitude: deviceImprov.longitude }
  );
  console.log("distancia", distance);
  return (
    <div>
      <h2>Mapa</h2>
      <p>Distância entre a pulseira e o dispositivo: {distance} metros</p>
      <MapContainer
        //center={position}
        center={[bleGPSData.latitude, bleGPSData.longitude]}
        zoom={16}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <RecenterAutomatically
          lat={deviceImprov.latitude}
          lng={deviceImprov.longitude}
        />
        {/* Marcador da posição da pulseira*/}
        <Marker position={[bleGPSData.latitude, bleGPSData.longitude]}>
          <Popup>
            Localização atual: <br />
            Latitude: {bleGPSData.latitude.toFixed(6)} <br />
            Longitude: {bleGPSData.longitude.toFixed(6)} <br />
            Velocidade: {bleGPSData.speed} m/s
          </Popup>
        </Marker>
        {/* Marcador da posição do dispositivo*/}
        <Marker position={[deviceImprov.latitude, deviceImprov.longitude]}>
          <Popup>
            Marcador fixo em Lisboa: <br />
            Latitude: {deviceImprov.latitude.toFixed(4)} <br />
            Longitude: {deviceImprov.longitude.toFixed(4)}
          </Popup>
        </Marker>
        {/* Círculo tracejado de 30 m */}
        <Circle
          center={[deviceImprov.latitude, deviceImprov.longitude]}
          radius={security_radius} // raio em metros
          pathOptions={{
            color: "#3388ff", // cor da borda
            weight: 2, // espessura da borda
            dashArray: "8,6", // define traço e espaço (8px traço / 6px espaço)
            fill: false, // sem preenchimento (apenas contorno)
          }}
        />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
