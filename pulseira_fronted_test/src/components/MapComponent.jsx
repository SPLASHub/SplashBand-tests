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
import { BraceletContext } from "./BLELocationTracker";

//TODO alerta em caso da pulseira se desconectar sozinha
//TODO alertar quando a distancia for maior que o raio de seguranca
//TODO FUTURO arranjar attempt reconnect quando se pede manualmente para desconectar

//+: BLELocationTracker : raio de seguranca em metros
const security_radius = 30;

const Dot = ({ valid }) => (
  <span
    style={{
      display: "inline-block",
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: valid ? "limegreen" : "crimson",
      marginLeft: 8,
      verticalAlign: "middle",
    }}
    title={valid ? "Dados BLE válidos" : "Dados BLE inválidos"}
  />
);

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const MapComponent = () => {
  //+: BLELocationTracker : estados do ble
  const {
    bleGPSData,
    bleConnectionStatus,
    bleGPSDataStatus,
    connectBLE,
    disconnectBLE,
  } = useContext(BraceletContext);
  //+: Para guardar ultimos dados validos
  const [lastGPSValidData, setGPSLastValidData] = useState(null);

  const { deviceGPSData } = useContext(PositionContext);
  console.log("bleGPSData", bleGPSData, "\nbleGPSDataStatus", bleGPSDataStatus);
  console.log("deviceGPSData", deviceGPSData);
  //!: DEVICE GPS NAO FUNFA BEM, POR ENQUANTO FICA ASSIM PARA NAO PERDER TEMPO VISTO QUE ISTO DEVE ESTAR ARRANJADO
  const [deviceImprov, setDeviceImprov] = useState({
    latitude: /* 40.6319694 */ 40.633481,
    longitude: /* -8.6555032 */ -8.659561,
  });

  //+: BLELocationTracker : Usar estes estados para determinar comportamentos
  const isDesconnected = bleConnectionStatus === "disconnected";
  const isConnected = bleConnectionStatus === "connected";
  const isConnectedInitial =
    bleConnectionStatus === "connected" && bleGPSDataStatus === "initial"; //?: ainda nunca recebeu dados - avisa para esperar conexão e aguardar ao lado do nadador salvador
  const isConnectedwithValidData =
    bleConnectionStatus === "connected" && bleGPSDataStatus === "valid"; //?: esta a receber dados validos - mostra a localizacao
  const isConnectedwithInvalidData =
    bleConnectionStatus === "connected" && bleGPSDataStatus === "invalid"; //?: esta a receber dados invalidos - avisa que nao esta a receber dados validos e mostra a ultima localizacao valida e a sua data
  const isAttemptingToConnectInitial =
    bleConnectionStatus === "attempting reconnection" &&
    bleGPSDataStatus === "initial";
  const isAttemptingToConnect =
    bleConnectionStatus === "attempting reconnection" &&
    bleGPSDataStatus === "invalid"; //?: avisa que a pulseira esta desconectada e a tentar reconectar, alerta para se aproximar da pulseira, mostra a ultima localizacao valida e a sua data
  //+: BLELocationTracker : Estados para debug - estes estados nao deviam ser possiveis
  //+: estados possiveis serao: Ci, Cv, Cx, Di (isDesconnected), Ai, Ax ; estados impossiveis:
  const Av =
    bleConnectionStatus === "attempting reconnection" &&
    bleGPSDataStatus === "valid"; //?: Connection-attempting reconnection && Data-valid
  const Dx =
    bleConnectionStatus === "disconnected" && bleGPSDataStatus === "invalid"; //?: Connection-disconnected && Data-initial
  const Dv =
    bleConnectionStatus === "disconnected" && bleGPSDataStatus === "valid"; //?: Connection-disconnected && Data-valid
  if (Av || Dx || Dv) {
    console.warn(
      "Encontrado estado inválido: \nConenctionStatus",
      bleConnectionStatus,
      "\nDataStatus",
      bleGPSDataStatus
    );
  }

  //+: BLELocationTracker : distancia entre a pulseira e o dispositivo
  let distance = null;
  if (
    !isDesconnected &&
    !isConnectedInitial &&
    deviceGPSData?.latitude != null
  ) {
    distance = getDistance(
      {
        latitude: lastGPSValidData.latitude,
        longitude: lastGPSValidData.longitude,
      },
      { latitude: deviceGPSData.latitude, longitude: deviceGPSData.longitude }
    );
  }

  const handleConnect = () => {
    connectBLE();
  };
  const handleDisconnect = () => {
    disconnectBLE();
    setGPSLastValidData(null);
  };

  useEffect(() => {
    if (isConnectedwithValidData) {
      setGPSLastValidData(bleGPSData);
    }
  }, [isConnectedwithValidData, bleGPSData]);

  console.log("distancia", distance);
  return (
    <div>
      {/*//+: BLELocationTracker : botoes de conectar e desconectar */}
      <div style={{ marginBottom: 16 }}>
        <strong>Status BLE:</strong> {bleConnectionStatus}
        {(isDesconnected || isAttemptingToConnect) && (
          <button onClick={handleConnect} style={{ marginLeft: 8 }}>
            Conectar Pulseira
          </button>
        )}
        {isConnected && (
          <button onClick={handleDisconnect} style={{ marginLeft: 8 }}>
            Desconectar
          </button>
        )}
        {isConnected && <Dot valid={isConnectedwithValidData} />}{" "}
        {/** Apenas para mostrar se os dados sao validos */}
      </div>
      <h2>Mapa</h2>
      {distance === null && (
        <p>Distância entre a pulseira e o dispositivo ainda não possivel de calcular</p>
      )}
      {distance !== null && (
        <p>Distância entre a pulseira e o dispositivo: {distance} m</p>
      )}
      <MapContainer
        //center={position}
        center={[deviceImprov.latitude, deviceImprov.longitude]}
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
        {/*//+: BLELocationTracker : Marcador da posicao com dados atualizados*/}
        {isConnectedwithValidData && bleGPSData && (
          <Marker position={[bleGPSData.latitude, bleGPSData.longitude]}>
            <Popup>
              Localização atual: <br />
              Latitude: {bleGPSData.latitude.toFixed(6)} <br />
              Longitude: {bleGPSData.longitude.toFixed(6)} <br />
              Velocidade: {bleGPSData.speed} m/s
            </Popup>
          </Marker>
        )}
        {/*//+: BLELocationTracker : Marcador da posicao com ultimos dados*/}
        {(isConnectedwithInvalidData || isAttemptingToConnect) &&
          lastGPSValidData && (
            <Marker
              position={[lastGPSValidData.latitude, lastGPSValidData.longitude]}
            >
              <Popup>
                Localização atual: <br />
                Latitude: {lastGPSValidData.latitude.toFixed(6)} <br />
                Longitude: {lastGPSValidData.longitude.toFixed(6)} <br />
                Velocidade: {lastGPSValidData.speed} m/s
              </Popup>
            </Marker>
          )}
        {/* Marcador da posicao do dispositivo*/}
        <Marker position={[deviceImprov.latitude, deviceImprov.longitude]}>
          <Popup>
            Marcador fixo: <br />
            Latitude: {deviceImprov.latitude.toFixed(4)} <br />
            Longitude: {deviceImprov.longitude.toFixed(4)}
          </Popup>
        </Marker>
        {/*//+: BLELocationTracker : Circulo de seguranca */}
        <Circle
          center={[deviceImprov.latitude, deviceImprov.longitude]}
          radius={security_radius}
          pathOptions={{
            color: "#3388ff",
            weight: 2,
            dashArray: "8,6",
            fill: false,
          }}
        />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
