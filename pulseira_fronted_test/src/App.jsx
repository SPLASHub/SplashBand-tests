import { useState } from "react";
import "./App.css";
/* import BLEScanner from "./components/BLEScanner"; */
import MapComponent from "./components/MapComponent";
import GetDeviceGPS from "./components/GetDeviceGPS_hmtl5";
//import GetDeviceGPS from "./components/GetDeviceGPS_reactGeolocation";
//** Encarregues da conecao ble */
import { PositionProvider } from "./components/Contexts"; // provisorio so para o contexto do device
//import BLEPulseira from "./components/BLEPulseira";
import { BlelnProvider } from "./components/BLELocationTracker";

function App() {
  return (
    <div>
      <h1>Aplicação BLE com React</h1>
      <PositionProvider>
        <BlelnProvider>
          {/* <BLEScanner onGpsData={setBleGpsData} /> */}
          {/* <BLEPulseira /> */}
          <GetDeviceGPS />
          <MapComponent />
        </BlelnProvider>
      </PositionProvider>
    </div>
  );
}

export default App;
