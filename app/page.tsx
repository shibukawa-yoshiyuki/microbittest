// app/page.tsx
"use client";

import { useState } from "react";

const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

export default function MicrobitControl() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [status, setStatus] = useState("未接続");

  // 1. micro:bit に BLE 接続する関数
  const connectBluetooth = async () => {
    // SSR 対策: navigator が存在するかチェック
    if (typeof window === "undefined" || !navigator.bluetooth) {
      alert("このブラウザは Web Bluetooth をサポートしていません。ChromeやEdge等をお使いください。");
      return;
    }

    try {
      setStatus("デバイスを探しています...");
      // micro:bit デバイスの要求
      const bleDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "BBC micro:bit" }],
        optionalServices: [UART_SERVICE_UUID],
      });

      setStatus("GATT サーバーに接続中...");
      const server = await bleDevice.gatt?.connect();

      setStatus("UART サービスを取得中...");
      const service = await server?.getPrimaryService(UART_SERVICE_UUID);

      setStatus("書き込み特性を取得中...");
      const txChar = await service?.getCharacteristic(UART_TX_CHARACTERISTIC_UUID);

      setDevice(bleDevice);
      setCharacteristic(txChar || null);
      setStatus("接続完了！");
    } catch (error) {
      console.error(error);
      setStatus(`接続失敗: ${error instanceof Error ? error.message : "不明なエラー"}`);
    }
  };

  // 2. micro:bit へ文字列を送信する関数
  const sendData = async (text: string) => {
    if (!characteristic) {
      alert("先に micro:bit と接続してください");
      return;
    }

    try {
      // MakeCode 側で改行を区切り文字にしているため、最後に \n を付与
      const encoder = new TextEncoder();
      const data = encoder.encode(text + "\n");
      await characteristic.writeValue(data);
      console.log(`送信成功: ${text}`);
    } catch (error) {
      console.error("送信失敗:", error);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Next.js × micro:bit BLE 制御</h1>
      <p>ステータス: <strong>{status}</strong></p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={connectBluetooth} style={{ padding: "10px" }}>
          micro:bit と接続する
        </button>
      </div>

      {characteristic && (
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => sendData("A")} style={{ padding: "10px 20px" }}>「A」を送信</button>
          <button onClick={() => sendData("B")} style={{ padding: "10px 20px" }}>「B」を送信</button>
          <button onClick={() => sendData("C")} style={{ padding: "10px 20px" }}>「C」を送信</button>
          <button onClick={() => sendData("Z")} style={{ padding: "10px 20px" }}>「Z」を送信</button>
        </div>
      )}
    </div>
  );
}
