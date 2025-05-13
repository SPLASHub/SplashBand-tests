import { useState } from 'react'
import './App.css'
import  BLEScanner  from "./components/BLEScanner";
import BLEPulseira from "./components/BLEPulseira";
import MapComponent from "./components/MapComponent"
import GetDeviceGPS from "./components/GetDeviceGPS_hmtl5";
//import GetDeviceGPS from "./components/GetDeviceGPS_reactGeolocation";
import { PositionProvider } from "./components/Contexts";

function App() {
  return (
    <div>
      <h1>Aplicação BLE com React</h1>
      <PositionProvider>
        {/* <BLEScanner onGpsData={setBleGpsData} /> */}
        <BLEPulseira/>
        <GetDeviceGPS/>
        <MapComponent />
      </PositionProvider>
    </div>
  );
}

export default App;