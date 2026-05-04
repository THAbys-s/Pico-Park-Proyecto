import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput
} from "react-native";

import { useKeepAwake } from "expo-keep-awake";
import { io } from "socket.io-client";

export default function App() {
  useKeepAwake();

  const [ip, setIp] = useState("");
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  const connect = () => {
    const s = io(`http://${ip}`, {
      transports: ["websocket"]
    });

    s.on("connect", () => {
      setConnected(true);
      s.emit("register", { type: "controller" });
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    setSocket(s);
  };

  const sendKey = (key, type) => {
    if (!socket) return;
    socket.emit(`input:${type}`, { key });
  };

  return (
    <View style={styles.container}>

      {/* CONEXIÓN */}
      {!connected && (
        <View style={styles.connectBox}>
          <Text>IP del servidor:</Text>

          <TextInput
            style={styles.input}
            placeholder="192.168.1.15:3000"
            value={ip}
            onChangeText={setIp}
          />

          <TouchableOpacity style={styles.button} onPress={connect}>
            <Text style={{ color: "#fff" }}>Conectar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* GAMEPAD */}
      {connected && (
        <View style={styles.gamepad}>

          {/* LED */}
          <View style={styles.statusRow}>
            <View style={[styles.led, { backgroundColor: "green" }]} />
            <Text>Conectado</Text>
          </View>

          <View style={styles.controls}>

            {/* D-PAD */}
            <View style={styles.dpad}>
              <TouchableOpacity
                onPressIn={() => sendKey("left", "keydown")}
                onPressOut={() => sendKey("left", "keyup")}
                style={styles.padButton}
              >
                <Text>←</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPressIn={() => sendKey("right", "keydown")}
                onPressOut={() => sendKey("right", "keyup")}
                style={styles.padButton}
              >
                <Text>→</Text>
              </TouchableOpacity>
            </View>

            {/* BOTÓN A */}
            <TouchableOpacity
              style={styles.actionButton}
              onPressIn={() => sendKey("jump", "keydown")}
              onPressOut={() => sendKey("jump", "keyup")}
            >
              <Text style={{ color: "#fff", fontSize: 20 }}>A</Text>
            </TouchableOpacity>

          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center"
  },

  connectBox: {
    padding: 20
  },

  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10
  },

  button: {
    backgroundColor: "#333",
    padding: 15,
    alignItems: "center"
  },

  gamepad: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },

  led: {
    width: 15,
    height: 15,
    borderRadius: 10
  },

  controls: {
    flexDirection: "row",
    justifyContent: "space-between"
  },

  dpad: {
    flexDirection: "row",
    gap: 20
  },

  padButton: {
    backgroundColor: "#ccc",
    padding: 30,
    borderRadius: 10
  },

  actionButton: {
    backgroundColor: "red",
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center"
  }
});