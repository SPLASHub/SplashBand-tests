import React, { createContext, useState } from "react";

// TODO fazer o ble_status para o mapa saber o que se passa com o ble
export const PositionContext = createContext({
  ble: null,
  ble_status: null,
  device: null,
});