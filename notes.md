# examples
```javascript
// User gesture required - navigator.bluetooth.requestDevice must be triggered by a user gesture
button.addEventListener('pointerup', function(event) {
  // Call navigator.bluetooth.requestDevice
});

// Request Bluetooth devices
navigator.bluetooth.requestDevice(
    filters: [
        {
            services: [0x1234, 0x12345678, '99999999-0000-1000-8000-00805f9b34fb']
        },
        {
            name: 'MyDeviceName'
        },
        {
             manufacturerData: [{
                companyIdentifier: 0x00e0,
                dataPrefix: new Uint8Array([0x01, 0x02])
            }]
        }
    ],
    exclusionFilters: [{
        name: "Created by Francois"
    }],
    optionalServices: ['battery_service'], // Required to access service later.
    acceptAllDevices: true,
)
.then(device => { 
    // Human-readable name of the device.
    console.log(device.name);
    // Attempts to connect to remote GATT Server.
    return device.gatt.connect();
})
.then(server => { 
    // Getting Battery Service…
    return server.getPrimaryService('battery_service');
})
.then(service => {
    // Getting Battery Level Characteristic…
    return service.getCharacteristic('battery_level');
})
.then(characteristic => {
    // Set up event listener for when characteristic value changes.
    characteristic.addEventListener('characteristicvaluechanged',handleBatteryLevelChanged);
    // Reading Battery Level…
    return characteristic.readValue();
})
.then(descriptor => descriptor.readValue())
.then(value => {
    console.log(`Battery percentage is ${value.getUint8(0)}`);
})
.catch(error => { console.error(error); });


function handleBatteryLevelChanged(event) {
  const batteryLevel = event.target.value.getUint8(0);
  console.log('Battery percentage is ' + batteryLevel);
}
```
Write to a Bluetooth Characteristic
Receive GATT notifications
Disconnect from a Bluetooth Device
Read and write to Bluetooth descriptors
