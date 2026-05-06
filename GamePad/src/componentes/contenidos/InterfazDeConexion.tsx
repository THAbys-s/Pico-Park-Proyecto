import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORES } from "../../constantes/colores";
import { ImageBackground } from "react-native";

type Props = {
  direccionIp: string;
  onCambiarIp: (ip: string) => void;
  onConectarConIp: () => void;
  onAbrirEscanerQR: () => void;
};

const InterfazDeConexion = ({
  direccionIp,
  onCambiarIp,
  onConectarConIp,
  onAbrirEscanerQR,
}: Props) => (

    <ImageBackground
    source={require("../../assets/background/PixelArt_Background.png")}
    style={estilos.contenedor}
    resizeMode="cover"
  >
    <Text style={estilos.titulo}>Interfaz de Conexión</Text>
    <TextInput
      style={estilos.inputIp}
      placeholder="Ingresa IP: ej. 192.168.1.100"
      placeholderTextColor={COLORES.INTERFAZ_PLACEHOLDER}
      value={direccionIp}
      onChangeText={onCambiarIp}
      keyboardType="default"
    />
    <View style={estilos.filaBotones}>
      <TouchableOpacity
        style={estilos.botonConectarConIp}
        onPress={onConectarConIp}
      >
        <Feather name="wifi" size={24} color={COLORES.INTERFAZ_TEXTO} />
        <Text style={estilos.textoDeBoton}>Conectar IP</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={estilos.botonConectarConQR}
        onPress={onAbrirEscanerQR}
      >
        <Feather name="camera" size={24} color={COLORES.INTERFAZ_TEXTO} />
        <Text style={estilos.textoDeBoton}>Escanear QR</Text>
      </TouchableOpacity>
    </View>
  </ImageBackground>
);

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.INTERFAZ_FONDO,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    color: COLORES.INTERFAZ_TITULO,
    fontWeight: "bold",
    marginBottom: 30,
    fontFamily: "monospace",
  },
  inputIp: {
    backgroundColor: COLORES.INTERFAZ_INPUT_FONDO,
    color: COLORES.INTERFAZ_TITULO,
    width: "100%",
    padding: 15,
    borderRadius: 0,
    fontSize: 16,
    textAlign: "center",
    borderWidth: 2,
    borderColor: COLORES.INTERFAZ_INPUT_BORDE,
    fontFamily: "monospace",
    marginBottom: 30,
  },
  filaBotones: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  botonConectarConIp: {
    backgroundColor: COLORES.INTERFAZ_BOTON_IP,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: COLORES.INTERFAZ_BOTON_BORDE,
    width: "80%",
    alignItems: "center",
    marginBottom: 20,
  },
  botonConectarConQR: {
    backgroundColor: COLORES.INTERFAZ_BOTON_QR,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: COLORES.INTERFAZ_BOTON_BORDE,
    width: "80%",
    alignItems: "center",
  },
  textoDeBoton: {
    color: COLORES.INTERFAZ_TEXTO,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
    textAlign: "center",
  },
});

export default InterfazDeConexion;
