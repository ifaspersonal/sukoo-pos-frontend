export async function printViaBluetooth(text: string) {
  const nav: any = navigator;

  if (!nav.bluetooth) {
    throw new Error("Bluetooth not supported");
  }

  const device = await nav.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [0xffe0],
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(0xffe0);
  const characteristic = await service.getCharacteristic(0xffe1);

  const encoder = new TextEncoder();
  await characteristic.writeValue(encoder.encode(text));
}