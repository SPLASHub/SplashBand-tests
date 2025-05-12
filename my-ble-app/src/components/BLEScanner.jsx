import { useState, useRef, useEffect } from "react";
import {STANDARD_SERVICES,STANDARD_SERVICES_NAMES, STANDARD_CHARACTERISTICS,STANDARD_CHARACTERISTICS_NAMES } from "./ids.jsx";
import { convertSpeed } from "geolib";

const optionalServices = [
  ...Object.keys(STANDARD_SERVICES)
];



export const BLEScanner = ({ onGpsData }) => {
  const [gpsData, setGpsData] = useState({
    latitude: 0,
    longitude: 0,
    altitude: 0,
    speed: 0,
    timestamp: "",
  });
  const [device, setDevice] = useState(null);
  const [server, setServer] = useState(null);
  const [services, setServices] = useState([]);
  const [characteristics, setCharacteristics] = useState({});
  const [status, setStatus] = useState("Desconectado");
  const [locationChar, setLocationChar] = useState(null);
  const pollingRef = useRef(null);

  const parseLocationSpeedData = (dataView) => {
    // Verifica se o buffer tem 20 bytes
    if (dataView.byteLength !== 20) {
      console.error("Tamanho do buffer inválido");
      return null;
    }
    // Lê os flags (byte 0)
    const flags = dataView.getUint8(0);
    // Decodifica os flags
    const hasLocation = (flags & 0x04) !== 0; // LN_FLAG_LOCATION_PRESENT (bit 2)
    const hasElevation = (flags & 0x08) !== 0; // LN_FLAG_ELEVATION_PRESENT (bit 3)
    const hasTime = (flags & 0x40) !== 0; // LN_FLAG_TIME_PRESENT (bit 6)
    const hasSpeed = (flags & 0x01) !== 0; // LN_FLAG_SPEED_PRESENT (bit 0)
    // Objeto para armazenar os dados decodificados
    const result = {};
    // Latitude e Longitude (int32, little-endian)
    if (hasLocation) {
      result.latitude = dataView.getInt32(1, true) / 1e7; // Converte para graus decimais
      result.longitude = dataView.getInt32(5, true) / 1e7;
    }
    // Altitude (int16, little-endian)
    if (hasElevation) {
      result.altitude = dataView.getInt16(9, true) / 10; // Converte para metros
    }
    // Velocidade (uint16, little-endian)
    if (hasSpeed) {
      result.speed = dataView.getUint16(11, true) / 10; // Converte para m/s
    }
    // Data e Hora
    if (hasTime) {
      const year = dataView.getUint16(13, true);
      const month = dataView.getUint8(15);
      const day = dataView.getUint8(16);
      const hour = dataView.getUint8(17);
      const minute = dataView.getUint8(18);
      const second = dataView.getUint8(19);

      // Formata a data (ex: "2023-10-05T14:30:45")
      result.timestamp = new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        second
      ).toISOString();
    }

    return result;
  };
  const requestDevice = async () => {
    try {
      setStatus("Procurando dispositivos...");
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: optionalServices,
      });
      console.log("navigator.bluetooth.requestDevice", device);
      console.log(device.id); // string persistente
      console.log(device.name); // "Pulseira"
      console.log(device.gatt.connected); // true / false

      setDevice(device);
      await connectToDevice(device);
      console.log("connectToDevice(device)", device);
    } catch (error) {
      setStatus(`Erro: ${error.message}`);
    }
  };

  const connectToDevice = async (device) => {
    try {
      setStatus("Conectando...");
      const server = await device.gatt.connect();
      setServer(server);
      setStatus("Conectado");
      console.log("device.gatt.connect():", device);
      console.log("discoverServices(server)", server);
      await discoverServices(server);
    } catch (error) {
      setStatus(`Erro na conexão: ${error.message}`);
    }
  };

  const discoverServices = async (server) => {
    try {
      const services = await server.getPrimaryServices();
      console.log("Serviços disponíveis:", services);
      console.log(
        "Serviços encontrados:",
        services.map((s) => s.uuid)
      );
      setServices(services);

      let charMap = {};
      for (let service of services) {
        const characteristics = await service.getCharacteristics();
        charMap[service.uuid] = characteristics;
      }
      console.log("Características disponíveis:", charMap);
      console.log("-----\n-----");
      console.log(charMap[STANDARD_SERVICES_NAMES.LN]);
      setCharacteristics(charMap);

      if (charMap[STANDARD_SERVICES_NAMES.LN]) {
        const locationSpeedChar = charMap[STANDARD_SERVICES_NAMES.LN].find(
          (char) => char.uuid === STANDARD_CHARACTERISTICS_NAMES.LOCATION_SPEED
        );
        if (locationSpeedChar) {
          setLocationChar(locationSpeedChar);
          console.log(
            "Característica de localização e velocidade encontrada:",
            locationSpeedChar
          );
        } else {
          console.log(
            "Característica de localização e velocidade não encontrada."
          );
        }
      } else {
        console.log(
          "Serviço de localização e navegação não encontrado.",
          STANDARD_SERVICES_NAMES.LN
        );
      }
    } catch (error) {
      console.error("Erro ao listar serviços:", error);
    }
  };

  const readCharacteristic = async (serviceUUID, characteristicUUID) => {
    try {
      const service = await server.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(
        characteristicUUID
      );
      const value = await characteristic.readValue();
      let decodedValue = "Dados binários não decodificáveis";

      if (
        characteristicUUID === STANDARD_CHARACTERISTICS_NAMES.LOCATION_SPEED
      ) {
        const decodedData = parseLocationSpeedData(value);
        if (decodedData) {
          /* setGpsData({
            latitude: decodedData.latitude,
            longitude: decodedData.longitude,
            altitude: decodedData.altitude,
            speed: decodedData.speed,
            timestamp: decodedData.timestamp
          }); */
          onGpsData(decodedData);
          alert(`Dados GPS:
            Latitude: ${decodedData.latitude}
            Longitude: ${decodedData.longitude}
            Altitude: ${decodedData.altitude} m
            Velocidade: ${decodedData.speed} m/s
            Horário: ${decodedData.timestamp}`);
        }
        return; // Importante: evita a execução do alerta abaixo
      }

      // Decodificação padrão para outras características
      decodedValue = new TextDecoder().decode(value);
      alert(`Valor da característica ${characteristicUUID}: ${decodedValue}`);
    } catch (error) {
      console.error("Erro ao ler característica:", error);
    }
  };
  // Polling ou notifications quando locationChar definido
  useEffect(() => {
    if (!locationChar) return;
    // Se suportar notificações
    if (locationChar.properties.notify) {
      locationChar.startNotifications().then(() => {
        locationChar.addEventListener("characteristicvaluechanged", (ev) => {
          const decoded = parseLocationSpeedData(ev.target.value);
          if (decoded) {
            setGpsData(decoded);
            onGpsData && onGpsData(decoded);
          }
        });
      });
    }
    // Polling fallback (1 leitura por segundo)
    pollingRef.current = setInterval(async () => {
      try {
        const value = await locationChar.readValue();
        const decoded = parseLocationSpeedData(value);
        if (decoded) {
          setGpsData(decoded);
          onGpsData && onGpsData(decoded);
        }
      } catch (err) {
        console.error("Erro polling characteristic:", err);
      }
    }, 1000);
    // Cleanup
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (locationChar.properties.notify) {
        locationChar.stopNotifications();
        locationChar.removeEventListener(
          "characteristicvaluechanged",
          () => {}
        );
      }
    };
  }, [locationChar, onGpsData]);
  const handleDisconnect = () => {
    if (device) {
      device.gatt.disconnect();
      setStatus("Desconectado");
      setDevice(null);
      setServer(null);
      setServices([]);
      setCharacteristics({});
    }
  };

  return (
    <div>
      <h2>Scanner BLE</h2>
      <p>Status: {status}</p>

      {!device ? (
        <button onClick={requestDevice}>Conectar</button>
      ) : (
        <>
          <button onClick={handleDisconnect}>Desconectar</button>
          <h2>Dispositivo conectado: {device.name} </h2>
          <h3>Serviços Descobertos:</h3>
          <ul>
            {services.map((service) => {
              const serviceName =
                STANDARD_SERVICES[service.uuid] || "Serviço Desconhecido";
              return (
                <li key={service.uuid}>
                  <strong>
                    {serviceName} ({service.uuid})
                  </strong>
                  <ul>
                    {characteristics[service.uuid]?.map((char) => {
                      const charName =
                        STANDARD_CHARACTERISTICS[char.uuid] ||
                        "Característica Desconhecida";
                      return (
                        <li key={char.uuid}>
                          {charName} ({char.uuid}){" "}
                          <button
                            onClick={() =>
                              readCharacteristic(service.uuid, char.uuid)
                            }
                          >
                            Ler
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

export default BLEScanner;
