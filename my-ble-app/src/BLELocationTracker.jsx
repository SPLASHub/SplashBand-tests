import React, { useState, useRef, useEffect, createContext } from "react";
//import {STANDARD_SERVICES,STANDARD_SERVICES_NAMES, STANDARD_CHARACTERISTICS,STANDARD_CHARACTERISTICS_NAMES } from "./ids.jsx";
const STANDARD_SERVICES = {
    "00001800-0000-1000-8000-00805f9b34fb": "Generic Access Profile",
    "00001801-0000-1000-8000-00805f9b34fb": "Generic Attribute Profile",
    "00001819-0000-1000-8000-00805f9b34fb": "Location and Navigation Service",
};
const STANDARD_SERVICES_NAMES = {
    GAP: "00001800-0000-1000-8000-00805f9b34fb",
    GATT: "00001801-0000-1000-8000-00805f9b34fb",
    LN: "00001819-0000-1000-8000-00805f9b34fb",
};
const STANDARD_CHARACTERISTICS = {
    "00002a67-0000-1000-8000-00805f9b34fb": "Location and Speed",
};
const STANDARD_CHARACTERISTICS_NAMES = {
    LOCATION_SPEED: "00002a67-0000-1000-8000-00805f9b34fb",
};

// TODO arranjar attempt reconnect quando se pede manualmente para desconectar
// TODO arranjar a reconexão
//TODO usar setBleGPSDataStatus

const discoverableServices = [...Object.keys(STANDARD_SERVICES)];

const deviceName = "Pulseira";

export const BraceletContext = createContext({
    bleGPSData: null,
    bleConnectionStatus: null,
    bleGPSDataStatus: null,
    connectBLE: () => { },
    disconnectBLE: () => { },
});
export function BlelnProvider({ children }) {
    // estados do provider
    const [bleGPSData, setBleGPSData] = useState(null);
    const [bleConnectionStatus, setBleConnectionStatus] = useState("disconnected");
    const [bleGPSDataStatus, setBleGPSDataStatus] = useState("initial");
    // estados para o ble
    const [device, setDevice] = useState(null);
    const [server, setServer] = useState(null);
    const [services, setServices] = useState([]);
    const [status, setStatus] = useState("Desconectado");
    const [locationChar, setLocationChar] = useState(null);
    const pollingRef = useRef(null);
    const manualDisconnectRef = useRef(false);
    const parseLocationSpeedData = (dataView) => {
        // buffer tem que ter 20 bytes
        if (dataView.byteLength !== 20) {
            console.error("Tamanho do buffer inválido");
            return null;
        }
        // ler flags
        const flags = dataView.getUint8(0);
        const hasLocation = (flags & 0x04) !== 0; // LN_FLAG_LOCATION_PRESENT (bit 2)
        const hasElevation = (flags & 0x08) !== 0; // LN_FLAG_ELEVATION_PRESENT (bit 3)
        const hasTime = (flags & 0x40) !== 0; // LN_FLAG_TIME_PRESENT (bit 6)
        const hasSpeed = (flags & 0x01) !== 0; // LN_FLAG_SPEED_PRESENT (bit 0)
        const result = {};
        // lat e lon (int32, little-endian)
        if (hasLocation) {
            result.latitude = dataView.getInt32(1, true) / 1e7; // Converte para graus decimais
            result.longitude = dataView.getInt32(5, true) / 1e7;
        }
        // altitude (int16, little-endian)
        if (hasElevation) {
            result.altitude = dataView.getInt16(9, true) / 10; // Converte para metros
        }
        // velocidade (uint16, little-endian)
        if (hasSpeed) {
            result.speed = dataView.getUint16(11, true) / 10; // Converte para m/s
        }
        // data e hora
        if (hasTime) {
            const year = dataView.getUint16(13, true);
            const month = dataView.getUint8(15);
            const day = dataView.getUint8(16);
            const hour = dataView.getUint8(17);
            const minute = dataView.getUint8(18);
            const second = dataView.getUint8(19);
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

    const connectBLE = async () => {
        try {
            setBleConnectionStatus("disconnected");
            setStatus("Procurando dispositivos...");
            navigator.bluetooth
                .requestDevice({
                    filters: [
                        { services: [STANDARD_SERVICES_NAMES.LN], name: deviceName },
                    ],
                })
                .then(async (bleDevice) => {
                    console.log("navigator.bluetooth.requestDevice", bleDevice);
                    console.log("Device ID: ", bleDevice.id); // string persistente
                    console.log("Device Name: ", bleDevice.name); // "Pulseira"
                    console.log("Device Gatt Connected: ", bleDevice.gatt.connected); // true / false
                    setDevice(bleDevice);
                    await setupServices(bleDevice);
                });
        } catch (err) {
            console.error(err);
            setStatus(`Erro: ${err.message}`);
        }
    }
    const disconnectBLE = () => {
        if (!device) return;
        manualDisconnectRef.current = true;
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        device.gatt.disconnect();
        setBleConnectionStatus("disconnected");
        setStatus("Desconectado");
        setDevice(null);
        setServer(null);
        setServices([]);
        setLocationChar(null);
    }
    // FIXME alterar o codigo da pulseira para nao mudar de MAC
    const attemptReconnect = async (bluetoothDevice) => {
        if (manualDisconnectRef.current) {
            console.log("Reconexão abortada – desconexão manual");
            return;
        }
        try {
            setBleConnectionStatus("attempting reconnection");
            setStatus("Tentando reconectar...");
            const reconnectedServer = await bluetoothDevice.gatt.connect();
            setServer(reconnectedServer);
            setStatus("Reconectado");
            await setupServices(reconnectedServer);
        } catch (err) {
            console.warn("Reconexão falhou, tentarei de novo em 1s", err);
            if (!manualDisconnectRef.current) {
                setTimeout(() => attemptReconnect(bluetoothDevice), 1000);
            }
        }
    };
    const setupServices = async (bleDevice) => {
        const bleServer = await bleDevice.gatt.connect();
        setServer(bleServer);
        setBleConnectionStatus("connected");
        setStatus("Conectado");
        console.log("Server: ", bleServer);
        const bleServices = await bleServer.getPrimaryServices();
        console.log("Serviços disponiveis:", bleServices);
        let charMap = {};
        for (let service of bleServices) {
            const characteristics = await service.getCharacteristics();
            charMap[service.uuid] = characteristics;
            for (let char of characteristics) {
                console.log("Characteristic:", char.uuid);
                if (
                    char.uuid ===
                    STANDARD_CHARACTERISTICS_NAMES.LOCATION_SPEED.toLowerCase()
                ) {
                    setLocationChar(char);
                }
            }
        }
        setServices(charMap);
    };
    // para polling
    useEffect(() => {
        // TODO no futuro implementar notifications
        if (!device || !locationChar) return;
        console.log("▶️ Starting polling…");
        pollingRef.current = window.setInterval(async () => {
            try {
                //console.log("Polling location speed…");
                const dv = await locationChar.readValue();
                //console.log("raw DataView:", dv);
                const data = parseLocationSpeedData(dv);
                //console.log("parsed GPS data:", data);
                if (data) {
                    setBleGPSData?.(data);
                }
            } catch (err) {
                console.warn("Polling error, stopping:", err);
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                }
            }
        }, 1000);
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, [device, locationChar, setGPSData]);
    // para reconectar
    useEffect(() => {
        if (!device) return;
        const onDisconnected = () => {
            if (manualDisconnectRef.current) {
                manualDisconnectRef.current = false;
                clearInterval(pollingRef.current);
                return;
            }
            console.warn("Pulseira BLE desconectou-se!");
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setBleConnectionStatus("disconnected");
            setStatus("Desconectado");
            attemptReconnect(device);
        };
        device.addEventListener("gattserverdisconnected", onDisconnected);
        return () => {
            device.removeEventListener("gattserverdisconnected", onDisconnected);
            clearInterval(pollingRef.current); //quando o componente desmonta
        };
    }, [device]);
    return (
        <BraceletContext.Provider
            value={{
                bleGPSData,
                bleConnectionStatus,
                bleGPSDataStatus,
                connectBLE,
                disconnectBLE,
            }}
        >
            {children}
        </BraceletContext.Provider>
    );
}
