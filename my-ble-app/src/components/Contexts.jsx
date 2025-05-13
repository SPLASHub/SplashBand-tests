import React, { createContext, useState } from "react";

// TODO fazer o ble_status para o mapa saber o que se passa com o ble
export const PositionContext = createContext({
  bleGPSData: null,
  setGPSData: () => {},
  bleConnectionStatus: null,
  setBleConnectionStatus: () => {},
  bleGPSDataStatus: null,
  setGPSDataStatus: () => {},
  deviceGPSData: null,
  setDeviceGPSData: () => {},
});

export function PositionProvider({ children }) {
  const [bleGPSData, setGPSData] = useState(null);
  const [bleConnectionStatus, setBleConnectionStatus] =
    useState("disconnected");
  const [bleGPSDataStatus, setGPSDataStatus] = useState("initial");
  const [deviceGPSData, setDeviceGPSData] = useState(null);

  return (
    <PositionContext.Provider
      value={{ bleGPSData, setGPSData, bleConnectionStatus, setBleConnectionStatus, bleGPSDataStatus, setGPSDataStatus, deviceGPSData, setDeviceGPSData }}
    >
      {children}
    </PositionContext.Provider>
  );
}