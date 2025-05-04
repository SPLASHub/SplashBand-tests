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
import { PositionContext } from "./Contexts";

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const MapComponent = () => {
  const { ble, device } = useContext(PositionContext);
  console.log("ble", ble);
  console.log("device", device);
  // DEVICE GPS NAO FUNFA BEM, POR ENQUANTO FICA ASSIM PARA NAO PERDER TEMPO VISTO QUE ISTO DEVE ESTAR ARRANJADO
  const [deviceImprov, setDeviceImprov] = useState({
    latitude: 39.6813485, // Lisboa
    longitude: -8.5204315, // Lisboa
  });
  if (
    !ble ||
    typeof ble.latitude === "undefined" ||
    !device ||
    typeof device.latitude === "undefined"
  ) {
    return <div>Carregando mapa...</div>;
  }
  return (
    <MapContainer
      //center={position}
      center={[ble.latitude, ble.longitude]}
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
      <Marker position={[ble.latitude, ble.longitude]}>
        <Popup>
          Localização atual: <br />
          Latitude: {ble.latitude.toFixed(6)} <br />
          Longitude: {ble.longitude.toFixed(6)} <br />
          Velocidade: {ble.speed} m/s
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
        radius={30} // raio em metros
        pathOptions={{
          color: "#3388ff", // cor da borda
          weight: 2, // espessura da borda
          dashArray: "8,6", // define traço e espaço (8px traço / 6px espaço)
          fill: false, // sem preenchimento (apenas contorno)
        }}
      />
    </MapContainer>
  );
};

export default MapComponent;
