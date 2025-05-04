import React, { useState, useEffect, useRef } from "react";
// Plugin para PWA/Cordova/Capacitor
//import { Geolocation as CapacitorGeolocation } from "@capacitor/geolocation";
// React Native (será apenas placeholder no browser)
import GeolocationRN from '@react-native-community/geolocation';
import L from "leaflet";
/**
 * Componente independente que obtém localização via diversos métodos
 * e exibe os resultados na página para comparação.
 */
const GeolocationComparison = () => {
  const [html5, setHtml5] = useState({
    lat: null,
    lng: null,
    speed: null,
    error: null,
  });
  const [watchingHtml5, setWatchingHtml5] = useState(false);
  const watcherRef = useRef(null);

  const [pwa, setPwa] = useState({
    lat: null,
    lng: null,
    speed: null,
    error: "Não configurado",
  });
  const [rn, setRn] = useState({
    lat: null,
    lng: null,
    speed: null,
    error: null,
  });
  const [leaflet, setLeaflet] = useState({
    lat: null,
    lng: null,
    speed: null,
    error: null,
  });

  /* // HTML5 Geolocation API
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setHtml5({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed,
            error: null,
          }),
        (err) => setHtml5((prev) => ({ ...prev, error: err.message }))
      );
    } else {
      setHtml5((prev) => ({
        ...prev,
        error: "API de Geolocation não suportada",
      }));
    }
  }, []); */
  // Handler para iniciar watchPosition no HTML5
  const startHtml5Watch = () => {
    if ("geolocation" in navigator) {
      watcherRef.current = navigator.geolocation.watchPosition(
        (pos) =>
          setHtml5({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed,
            error: null,
          }),
        (err) => setHtml5((prev) => ({ ...prev, error: err.message })),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
      setWatchingHtml5(true);
    } else {
      setHtml5((prev) => ({
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

  // PWA / Cordova / Capacitor
  /*   useEffect(() => {
    if (CapacitorGeolocation && CapacitorGeolocation.getCurrentPosition) {
      CapacitorGeolocation.getCurrentPosition({ enableHighAccuracy: true })
        .then((pos) => {
          setPwa({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed,
            error: null,
          });
        })
        .catch((err) => {
          setPwa((prev) => ({
            ...prev,
            error: err.message || JSON.stringify(err),
          }));
        });
    } else {
      setPwa((prev) => ({
        ...prev,
        error: "Plugin Capacitor Geolocation não disponível",
      }));
    }
  }, []); */

  // React Native (placeholder no web)
  useEffect(() => {
    if (GeolocationRN && GeolocationRN.watchPosition) {
      const watchId = GeolocationRN.watchPosition(
        (pos) =>
          setRn({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed,
            error: null,
          }),
        (err) => setRn((prev) => ({ ...prev, error: err.message })),
        { enableHighAccuracy: true, distanceFilter: 1 }
      );
      return () => GeolocationRN.clearWatch(watchId);
    } else {
      setRn((prev) => ({
        ...prev,
        error: "Disponível apenas em React Native",
      }));
    }
  }, []);
  // Leaflet LocateControl (configuração no MapComponent)
  useEffect(() => {
    try {
      const container = document.createElement("div");
      const map = L.map(container);
      map.locate({ watch: true, setView: false, enableHighAccuracy: true });
      map.on("locationfound", (e) => {
        setLeaflet({
          lat: e.latitude,
          lng: e.longitude,
          speed: e.speed,
          error: null,
        });
      });
      map.on("locationerror", (e) => {
        setLeaflet((prev) => ({ ...prev, error: e.message }));
      });
      return () => map.stopLocate();
    } catch (err) {
      setLeaflet((prev) => ({ ...prev, error: err.message }));
    }
  }, []);

  const renderPos = ({ lat, lng, speed, error }) => {
    if (error) return <p style={{ color: "red" }}>Erro: {error}</p>;
    if (lat == null) return <p>Obtendo...</p>;
    return (
      <p>
        Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
        {speed != null ? `, Speed: ${speed} m/s` : ""}
      </p>
    );
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: 8 }}>
      <h2>Comparação de métodos de Geolocalização (Contínuo)</h2>

      <section>
        <h3>1. HTML5 Geolocation API</h3>
        {!watchingHtml5 ? (
          <button onClick={startHtml5Watch}>Ativar localização</button>
        ) : (
          renderPos(html5)
        )}
      </section>

      <section>
        <h3>2. React Native</h3>
        {renderPos(rn)}
      </section>

      <section>
        <h3>3. Leaflet LocateControl</h3>
        {renderPos(leaflet)}
      </section>
    </div>
  );
};

export default GeolocationComparison;
