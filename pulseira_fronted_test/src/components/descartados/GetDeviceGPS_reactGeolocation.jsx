import React, { useState, useEffect, useRef } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import Geolocation from "@react-native-community/geolocation";

/**
 * Componente React Native para obter localização contínua via GeolocationRN,
 * exibindo precisão, contador de leituras e filtrando leituras imprecisas.
 */
const GetDeviceGPS = ({ onGpsData }) => {
  const [posData, setPosData] = useState({
    latitude: null,
    longitude: null,
    speed: null,
    accuracy: null,
    error: null,
  });
  const [watching, setWatching] = useState(false);
  const watchIdRef = useRef(null);
  const readCountRef = useRef(0);

  const startWatching = () => {
    watchIdRef.current = Geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        // Incrementa contador de leituras
        readCountRef.current += 1;
        console.log(
          `Leitura #${readCountRef.current}: lat=${latitude.toFixed(
            6
          )}, lng=${longitude.toFixed(6)}, accuracy=${accuracy.toFixed(1)}m`
        );

        if (accuracy <= 30) {
          const data = { latitude, longitude, speed, accuracy };
          setPosData({ ...data, error: null });
          onGpsData && onGpsData(data);
        } else {
          setPosData((prev) => ({
            ...prev,
            accuracy,
            error: `Precisão baixa (${accuracy.toFixed(1)}m)`,
          }));
        }
      },
      (err) => {
        console.error("Erro na leitura de localização:", err.message);
        setPosData((prev) => ({ ...prev, error: err.message }));
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 1000,
        fastestInterval: 500,
        useSignificantChanges: false,
      }
    );
    setWatching(true);
  };

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const renderPosition = () => {
    const { latitude, longitude, speed, accuracy, error } = posData;
    if (error) return <Text style={styles.error}>Erro: {error}</Text>;
    if (latitude == null)
      return <Text style={styles.info}>Aguardando ativação...</Text>;
    return (
      <View>
        <Text style={styles.info}>Lat: {latitude.toFixed(6)}</Text>
        <Text style={styles.info}>Lng: {longitude.toFixed(6)}</Text>
        <Text style={styles.info}>
          Velocidade: {speed != null ? speed.toFixed(1) : "—"} m/s
        </Text>
        <Text style={styles.info}>
          Precisão: {accuracy != null ? accuracy.toFixed(1) : "—"} m
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Obter localização contínua (React Native)
      </Text>
      {!watching ? (
        <Button title="Ativar localização" onPress={startWatching} />
      ) : (
        renderPosition()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    margin: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    marginBottom: 4,
  },
  error: {
    fontSize: 14,
    color: "red",
    marginBottom: 4,
  },
});

export default GetDeviceGPS;
