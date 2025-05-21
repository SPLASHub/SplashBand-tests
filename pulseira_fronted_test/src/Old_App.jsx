import { useState } from "react";
import "./App.css";
/* import BLEScanner from "./components/BLEScanner"; */
import MapComponent from "./components/MapComponentOld";
import GetDeviceGPS from "./components/GetDeviceGPS_hmtl5";
//import GetDeviceGPS from "./components/GetDeviceGPS_reactGeolocation";
//** Encarregues da conecao ble */
import { PositionProvider } from "./components/Contexts"; // provisorio so para o contexto do device
import BLEPulseira from "./components/Old_BLEPulseira";

function App() {
  return (
    <div>
      <h1>Aplicação BLE com React</h1>
      <PositionProvider>
          {/* <BLEScanner onGpsData={setBleGpsData} /> */}
          <BLEPulseira />
          <GetDeviceGPS />
          <MapComponent />
      </PositionProvider>
    </div>
  );
}

export default App;
