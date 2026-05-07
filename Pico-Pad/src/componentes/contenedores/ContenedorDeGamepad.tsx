import React from "react";
import {
  StyleSheet,
  View,
  LayoutChangeEvent,
  GestureResponderEvent,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ControlDeSalto from "../contenidos/ControlDeSalto";
import BotonParaSalir from "../contenidos/BotonParaSalir";
import PanelDeDirecciones from "../contenidos/PanelDeDirecciones";
import EstadoDeEnlace from "../contenidos/EstadoDeEnlace";
import { COLORES } from "../../constantes/colores";

type Props = {
  onSalir: () => void;
  onCapturarLayoutDpad: (e: LayoutChangeEvent) => void;
  onCapturarLayoutArriba: (e: LayoutChangeEvent) => void;
  onCapturarLayoutAbajo: (e: LayoutChangeEvent) => void;
  onCapturarLayoutIzquierda: (e: LayoutChangeEvent) => void;
  onCapturarLayoutDerecha: (e: LayoutChangeEvent) => void;
  onCapturarLayoutSalto: (e: LayoutChangeEvent) => void;
  onProcesarToques: (e: GestureResponderEvent) => void;
  idJugador?: number;
  totalJugadores?: number;
};

const ContenedorDeGamepad = ({
  onSalir,
  onCapturarLayoutDpad,
  onCapturarLayoutArriba,
  onCapturarLayoutAbajo,
  onCapturarLayoutIzquierda,
  onCapturarLayoutDerecha,
  onCapturarLayoutSalto,
  onProcesarToques,
  idJugador,
  totalJugadores,
}: Props) => (
  <SafeAreaView style={estilos.contenedor}>
    <View style={estilos.barraSuperior}>
      <View>
        <EstadoDeEnlace />
        {idJugador !== undefined && (
          <Text style={estilos.textoJugador}>
            Jugador {idJugador + 1} ({totalJugadores}/4)
          </Text>
        )}
      </View>
      <BotonParaSalir onSalir={onSalir} />
    </View>
    <View
      style={estilos.zonaDeControles}
      onTouchStart={onProcesarToques}
      onTouchMove={onProcesarToques}
      onTouchEnd={onProcesarToques}
      onTouchCancel={onProcesarToques}
    >
      <View style={estilos.capaVisual} pointerEvents="none">
        <PanelDeDirecciones
          onCapturarLayout={onCapturarLayoutDpad}
          onCapturarLayoutArriba={onCapturarLayoutArriba}
          onCapturarLayoutAbajo={onCapturarLayoutAbajo}
          onCapturarLayoutIzquierda={onCapturarLayoutIzquierda}
          onCapturarLayoutDerecha={onCapturarLayoutDerecha}
        />
        <ControlDeSalto onCapturarLayout={onCapturarLayoutSalto} />
      </View>
    </View>
  </SafeAreaView>
);

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.FONDO_PRINCIPAL },
  barraSuperior: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 50,
    zIndex: 10,
  },
  textoJugador: {
    color: COLORES.TEXTO_PRINCIPAL,
    fontSize: 12,
    marginTop: 4,
  },
  zonaDeControles: { flex: 1, position: "relative" },
  capaVisual: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 60,
    paddingBottom: 20,
  },
});

export default ContenedorDeGamepad;
