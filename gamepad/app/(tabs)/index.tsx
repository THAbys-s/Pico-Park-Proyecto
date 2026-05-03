import React, { useState, useEffect, useRef } from "react";
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

  const inputState = useRef({
    left: false,
    right: false,
    jump: false
  });

  // 🔌 CONECTAR (arreglado)
  const connect = () => {
    if (socket) {
      socket.disconnect(); // 🔥 evita múltiples jugadores
    }

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

  // 🧹 cleanup
  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  // 🎮 INPUTS (multitouch real)
  const sendKeyDown = (key) => {
    if (!socket) return;

    if (!inputState.current[key]) {
      inputState.current[key] = true;
      socket.emit("input:keydown", { key });
    }
  };

  const sendKeyUp = (key) => {
    if (!socket) return;

    if (inputState.current[key]) {
      inputState.current[key] = false;
      socket.emit("input:keyup", { key });
    }
  };

  return (
    <View style={styles.container}>

      {/* 🔌 CONEXIÓN */}
      {!connected && (
        <View style={styles.connectBox}>
          <Text style={styles.label}>IP del servidor</Text>

          <TextInput
            style={styles.input}
            placeholder="192.168.1.15:3000"
            placeholderTextColor="#888"
            value={ip}
            onChangeText={setIp}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={connect}
            disabled={connected}
          >
            <Text style={styles.buttonText}>CONECTAR</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🎮 GAMEPAD */}
      {connected && (
        <View style={styles.gamepad}>

          {/* LED */}
          <View style={styles.statusRow}>
            <View style={[styles.led, { backgroundColor: "green" }]} />
            <Text style={styles.label}>Conectado</Text>
          </View>

          <View style={styles.controls}>

            {/* ⬅️➡️ */}
            <View style={styles.dpad}>
              <TouchableOpacity
                onPressIn={() => sendKeyDown("left")}
                onPressOut={() => sendKeyUp("left")}
                style={styles.padButton}
              >
                <Text style={styles.padText}>←</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPressIn={() => sendKeyDown("right")}
                onPressOut={() => sendKeyUp("right")}
                style={styles.padButton}
              >
                <Text style={styles.padText}>→</Text>
              </TouchableOpacity>
            </View>

            {/* 🔴 BOTONES */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "red" }]}
                onPressIn={() => sendKeyDown("jump")}
                onPressOut={() => sendKeyUp("jump")}
              >
                <Text style={styles.actionText}>A</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "blue" }]}
              >
                <Text style={styles.actionText}>B</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* START / SELECT */}
          <View style={styles.centerButtons}>
            <View style={styles.smallBtn}>
              <Text style={styles.smallText}>SELECT</Text>
            </View>
            <View style={styles.smallBtn}>
              <Text style={styles.smallText}>START</Text>
            </View>
          </View>

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center"
  },

  connectBox: {
    padding: 20
  },

  label: {
    color: "#fff"
  },

  input: {
    borderWidth: 1,
    borderColor: "#555",
    padding: 10,
    marginVertical: 10,
    color: "#fff"
  },

  button: {
    backgroundColor: "#333",
    padding: 15,
    alignItems: "center"
  },

  buttonText: {
    color: "#fff"
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
    backgroundColor: "#444",
    padding: 30,
    borderRadius: 10
  },

  padText: {
    color: "#fff",
    fontSize: 24
  },

  actions: {
    alignItems: "center",
    gap: 20
  },

  actionButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center"
  },

  actionText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold"
  },

  centerButtons: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 20
  },

  smallBtn: {
    backgroundColor: "#555",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5
  },

  smallText: {
    color: "#fff",
    fontSize: 12
  }
});