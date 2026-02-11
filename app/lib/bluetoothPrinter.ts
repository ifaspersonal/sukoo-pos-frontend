export async function printViaBluetooth(text: string) {
  if (!navigator.bluetooth) {
    alert("Browser tidak support Bluetooth");
    return;
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [0xFFE0], // umum untuk ESC/POS
  });

  const server = await device.gatt!.connect();
  const service = await server.getPrimaryService(0xFFE0);
  const characteristic = await service.getCharacteristic(0xFFE1);

  const encoder = new TextEncoder();
  await characteristic.writeValue(encoder.encode(text));
}