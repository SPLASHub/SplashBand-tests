import React, { useState, useEffect, useRef, useContext } from "react";
import { PositionContext } from "./Contexts";


const GetDeviceGPS = () => {
  const { setDeviceGPSData } = useContext(PositionContext);
  const [posData, setPosData] = useState({
    latitude: null,
    longitude: null,
    speed: null,
    accuracy: null,
    error: null,
  });
  const [watching, setWatching] = useState(false);
  const watcherRef = useRef(null);
  const readCountRef = useRef(0);

  const startWatching = () => {
    if ("geolocation" in navigator) {
      watcherRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed, accuracy } = pos.coords;
          readCountRef.current += 1;
          console.log(
            `Leitura #${readCountRef.current}: lat=${latitude.toFixed(
              6
            )}, lng=${longitude.toFixed(6)}, accuracy=${accuracy.toFixed(1)}m`
          );
          // Filtrar leituras com má precisão (>30m)
          if (accuracy <= 30) {
            const data = { latitude, longitude, speed, accuracy };
            setPosData({ ...data, error: null });
            setDeviceGPSData && setDeviceGPSData(data);
          } else {
            // opcionalmente atualizar apenas accuracy
            setPosData((prev) => ({
              ...prev,
              accuracy,
              error: `Precisão baixa (${accuracy.toFixed(1)}m)`,
            }));
          }
        },
        (err) => setPosData((prev) => ({ ...prev, error: err.message })),
        {
          enableHighAccuracy: true,
          maximumAge: 0, // sem cache
          timeout: Infinity, // sem timeout forçado
        }
      );
      setWatching(true);
    } else {
      setPosData((prev) => ({
        ...prev,
        error: "API de Geolocation não suportada",
      }));
    }
  };

  // Cleanup do watch on unmount
  useEffect(() => {
    return () => {
      if (watcherRef.current !== null) {
        navigator.geolocation.clearWatch(watcherRef.current);
      }
    };
  }, []);

  const renderPosition = () => {
    const { latitude, longitude, speed, accuracy, error } = posData;
    if (error) return <p style={{ color: "red" }}>Erro: {error}</p>;
    if (latitude == null) return <p>Aguardando ativação...</p>;
    return (
      <p>
        Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)} <br />
        {/* Velocidade: {speed != null ? speed.toFixed(1) : "—"} m/s <br /> */}
        Precisão: {accuracy != null ? accuracy.toFixed(1) : "—"} m
      </p>
    );
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: 8 }}>
      <h3>
        Obtenção da Geolocalização de forma contíua apartir de HTML5 Geolocation
        API
      </h3>

      <section>
        {!watching ? (
          <button onClick={startWatching}>Ativar localização</button>
        ) : (
          renderPosition()
        )}
      </section>
    </div>
  );
};

export default GetDeviceGPS;
