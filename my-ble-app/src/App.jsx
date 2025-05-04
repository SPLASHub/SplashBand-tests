import { useState } from 'react'
import './App.css'
import  BLEScanner  from "./components/BLEScanner";
import MapComponent from "./components/MapComponent"
import GetDeviceGPS from "./components/GetDeviceGPS_hmtl5";
//import GetDeviceGPS from "./components/GetDeviceGPS_reactGeolocation";
import { PositionContext } from "./components/Contexts";

function App() {
  const [bleGPSData, setBleGpsData] = useState(null);
  const [deviceGPSData, setDeviceGPSData] = useState(null);
  return (
    <div>
      <h1>Aplicação BLE com React</h1>
      <PositionContext.Provider
        value={{ ble: bleGPSData, device: deviceGPSData }}
      >
        {/* BLEScanner actualiza o estado através de uma prop */}
        <BLEScanner onGpsData={setBleGpsData} />
        <GetDeviceGPS onGpsData={setDeviceGPSData} />
        <MapComponent /> {/* Consumidor vê o mesmo contexto */}
      </PositionContext.Provider>
    </div>
  );
}

export default App;