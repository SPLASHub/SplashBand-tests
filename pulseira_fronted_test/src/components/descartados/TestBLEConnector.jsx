import { useState } from 'react';

// Definição de todos os UUIDs
const SERVICES = {
  GAP: '00001800-0000-1000-8000-00805f9b34fb',
  GATT: '00001801-0000-1000-8000-00805f9b34fb',
  ANS: '00001811-0000-1000-8000-00805f9b34fb',
  GNSS: '00001136-0000-1000-8000-00805f9b34fb'
};

const CHARACTERISTICS = {
  // GAP
  DEVICE_NAME: '00002a00-0000-1000-8000-00805f9b34fb',
  APPEARANCE: '00002a01-0000-1000-8000-00805f9b34fb',
  
  // GATT
  SERVICE_CHANGED: '00002a05-0000-1000-8000-00805f9b34fb',
  SERVER_FEATURES: '00002b3a-0000-1000-8000-00805f9b34fb',
  CLIENT_FEATURES: '00002b29-0000-1000-8000-00805f9b34fb',
  
  // ANS
  NEW_ALERT_CATEGORY: '00002a47-0000-1000-8000-00805f9b34fb',
  NEW_ALERT: '00002a46-0000-1000-8000-00805f9b34fb',
  UNREAD_ALERT_CATEGORY: '00002a48-0000-1000-8000-00805f9b34fb',
  UNREAD_ALERT_STATUS: '00002a45-0000-1000-8000-00805f9b34fb',
  ALERT_CONTROL_POINT: '00002a44-0000-1000-8000-00805f9b34fb',
  
  // GNSS
  GPGGA: 'fb349b5f-8000-0080-0010-000000002a67'
};

const DESCRIPTORS = {
  CCCD: '00002902-0000-1000-8000-00805f9b34fb'
};

export const BLEConnector = () => {
  const [device, setDevice] = useState(null);
  const [server, setServer] = useState(null);
  const [services, setServices] = useState({});
  const [status, setStatus] = useState('Disconnected');
  const [receivedData, setReceivedData] = useState('');

  const requestDevice = async () => {
    try {
      setStatus('Procurando dispositivos...');
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: false,
        filters: [{ services: Object.values(SERVICES) }],
        optionalServices: Object.values(SERVICES)
      });
      
      setDevice(device);
      await connectToDevice(device);
    } catch (error) {
      setStatus(`Erro: ${error.message}`);
    }
  };

  const connectToDevice = async (device) => {
    try {
      setStatus('Conectando...');
      const server = await device.gatt.connect();
      setServer(server);

      // Carregar todos os serviços
      const loadedServices = {};
      
      // GAP Service
      loadedServices.GAP = {
        service: await server.getPrimaryService(SERVICES.GAP),
        characteristics: {
          deviceName: await getCharacteristic(SERVICES.GAP, CHARACTERISTICS.DEVICE_NAME),
          appearance: await getCharacteristic(SERVICES.GAP, CHARACTERISTICS.APPEARANCE)
        }
      };

      // GATT Service
      loadedServices.GATT = {
        service: await server.getPrimaryService(SERVICES.GATT),
        characteristics: {
          serviceChanged: await getCharacteristic(SERVICES.GATT, CHARACTERISTICS.SERVICE_CHANGED),
          serverFeatures: await getCharacteristic(SERVICES.GATT, CHARACTERISTICS.SERVER_FEATURES)
        }
      };

      // ANS Service
      loadedServices.ANS = {
        service: await server.getPrimaryService(SERVICES.ANS),
        characteristics: {
          newAlertCategory: await getCharacteristic(SERVICES.ANS, CHARACTERISTICS.NEW_ALERT_CATEGORY),
          newAlert: await getCharacteristic(SERVICES.ANS, CHARACTERISTICS.NEW_ALERT),
          unreadAlertStatus: await getCharacteristic(SERVICES.ANS, CHARACTERISTICS.UNREAD_ALERT_STATUS)
        }
      };

      // GNSS Service
      loadedServices.GNSS = {
        service: await server.getPrimaryService(SERVICES.GNSS),
        characteristics: {
          gpgga: await getCharacteristic(SERVICES.GNSS, CHARACTERISTICS.GPGGA)
        }
      };

      setServices(loadedServices);
      setStatus('Conectado');

      // Configurar notificações
      await setupNotifications();

    } catch (error) {
      setStatus(`Erro na conexão: ${error.message}`);
    }
  };

  const getCharacteristic = async (serviceUUID, characteristicUUID) => {
    const service = await server.getPrimaryService(serviceUUID);
    return await service.getCharacteristic(characteristicUUID);
  };

  const setupNotifications = async () => {
    try {
      // Configurar Service Changed
      const serviceChangedChar = services.GATT.characteristics.serviceChanged;
      const cccd = await serviceChangedChar.getDescriptor(DESCRIPTORS.CCCD);
      await cccd.writeValue(new Uint16Array([0x0002])); // Enable indications
      serviceChangedChar.addEventListener('characteristicvaluechanged', handleServiceChanged);

      // Configurar GNSS Notifications
      const gnssChar = services.GNSS.characteristics.gpgga;
      await gnssChar.startNotifications();
      gnssChar.addEventListener('characteristicvaluechanged', handleGNSSData);

      // Configurar Alertas
      const alertChar = services.ANS.characteristics.newAlert;
      await alertChar.startNotifications();
      alertChar.addEventListener('characteristicvaluechanged', handleAlerts);

    } catch (error) {
      console.error('Erro nas notificações:', error);
    }
  };

  const handleServiceChanged = (event) => {
    const value = event.target.value;
    const startHandle = value.getUint16(0, true);
    const endHandle = value.getUint16(2, true);
    setReceivedData(prev => prev + `Serviços alterados: ${startHandle}-${endHandle}\n`);
    server.discoverServices();
  };

  const handleGNSSData = (event) => {
    const value = event.target.value;
    const data = new TextDecoder().decode(value);
    setReceivedData(prev => prev + `GNSS: ${data}\n`);
  };

  const handleAlerts = (event) => {
    const value = event.target.value;
    const alertData = new Uint8Array(value.buffer);
    setReceivedData(prev => prev + `ALERTA: ${alertData}\n`);
  };

  const readData = async (service, characteristic) => {
    if (services[service]?.characteristics[characteristic]) {
      const value = await services[service].characteristics[characteristic].readValue();
      return new TextDecoder().decode(value);
    }
    return null;
  };

  const writeData = async (service, characteristic, data) => {
    if (services[service]?.characteristics[characteristic]) {
      const encoder = new TextEncoder();
      await services[service].characteristics[characteristic].writeValue(encoder.encode(data));
    }
  };

  const handleDisconnect = () => {
    if (device) {
      device.gatt.disconnect();
      setStatus('Desconectado');
      setDevice(null);
      setServer(null);
      setServices({});
    }
  };

  return (
    <div>
      <h2>Controle BLE Avançado</h2>
      <p>Status: {status}</p>
      
      {!device ? (
        <button onClick={requestDevice}>Conectar</button>
      ) : (
        <>
          <button onClick={handleDisconnect}>Desconectar</button>
          
          <div className="service-section">
            <h3>GNSS</h3>
            <button onClick={() => readData('GNSS', 'GPGGA').then(data => 
              setReceivedData(prev => prev + `GNSS: ${data}\n`))}>
              Ler Posição
            </button>
          </div>

          <div className="service-section">
            <h3>Alertas</h3>
            <button onClick={() => writeData('ANS', 'newAlert', 'START_ALERTS')}>
              Ativar Alertas
            </button>
          </div>

          <div className="service-section">
            <h3>Informações do Dispositivo</h3>
            <button onClick={() => readData('GAP', 'deviceName').then(name => 
              setReceivedData(prev => prev + `Nome: ${name}\n`))}>
              Ler Nome
            </button>
          </div>
        </>
      )}

      <div>
        <h3>Dados Recebidos:</h3>
        <pre>{receivedData}</pre>
      </div>
    </div>
  );
};