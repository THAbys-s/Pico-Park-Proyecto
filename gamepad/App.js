import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { io } from "socket.io-client";
import * as KeepAwake from "expo-keep-awake";

import DPad from "./components/DPad";
import JumpButton from "./components/JumpButton";
import ConnectionStatus from "./components/ConnectionStatus";

export default function App() {
  const [ip, setIp] = useState("");
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    KeepAwake.activateKeepAwake();
  }, []);

  const connect = () => {
    if (!ip) return;

    const s = io(`http://${ip}:3000`, {
      transports: ["websocket"],
    });

    s.on("connect", () => {
      setConnected(true);
      s.emit("register", { type: "player" });
    });

    s.on("disconnect", () => setConnected(false));

    setSocket(s);
  };

  const send = (type, key) => {
    if (!socket || !connected) return;
    socket.emit(`input:${type}`, { key });
  };

  return (
    <View style={styles.container}>

      <ConnectionStatus connected={connected} />

      {!connected && (
        <>
          <Text style={styles.label}>Ingresá la IP del host</Text>

          <TextInput
            placeholder="192.168.x.x"
            value={ip}
            onChangeText={setIp}
            style={styles.input}
          />

          <Text style={styles.button} onPress={connect}>
            CONECTAR
          </Text>
        </>
      )}

      {connected && (
        <View style={styles.gamepad}>
          <DPad send={send} />
          <JumpButton send={send} />
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    color: "#fff",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    width: 220,
    padding: 10,
    margin: 10,
  },
  button: {
    color: "#0f0",
    fontSize: 20,
  },
  gamepad: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 40,
  },
});