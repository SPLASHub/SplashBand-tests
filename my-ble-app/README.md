# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Web Bluetooth API
-  Web Bluetooth API specification is not finalized yet
-  available in ChromeOS, Chrome for Android 6.0, Mac (Chrome 56) and Windows 10 (Chrome 70)
- HTTPS only

/** GATT server. */
#define GATT_SVR_SVC_ALERT_UUID               0x1811
#define GATT_SVR_CHR_SUP_NEW_ALERT_CAT_UUID   0x2A47
#define GATT_SVR_CHR_NEW_ALERT                0x2A46
#define GATT_SVR_CHR_SUP_UNR_ALERT_CAT_UUID   0x2A48
#define GATT_SVR_CHR_UNR_ALERT_STAT_UUID      0x2A45
#define GATT_SVR_CHR_ALERT_NOT_CTRL_PT        0x2A44

/** GAP appeance macros que nao estao declarados em services/gap/ble_svc_gap.h */
#define BLE_SVC_GAP_APPEARANCE_CATEGORY_GPS   0x044C
#define BLE_APPEARANCE_GENERIC_WATCH  0x00C0

/** GNSS Server service UUID. */
#define GNSS_SERVER_SVC_UUID   0x1136 // No BLE, o descobrimento de serviços e características ocorre via GATT (UUIDs e Services), não via SDP.
/** N TENHO A CERTEZA */
#define GNSS__SVC_UUID 0x1135 // No BLE, o descobrimento de serviços e características ocorre via GATT (UUIDs e Services), não via SDP.
#define LATITUDE_CHR_UUID 0x2A67
#define LONGITUDE_CHR_UUID 0x2A68

#define BLE_UUID_LOCATION_NAV_SVC     0x1819 // LN Service
#define BLE_UUID_LOC_SPEED_CHR        0x2A67 // Characteristic "Location and Speed

/* Flags bit definitions (simplificado):
   - bit0 = Instant Speed Present
   - bit1 = Total Distance Present
   - bit2 = Location Present
   - bit3 = Elevation Present
   - bit4 = Heading Present
   - bit5 = Rolling Time Present
   - bit6 = UTC Time Present
   - bit7 = Remaining bits
*/