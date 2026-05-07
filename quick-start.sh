#!/bin/bash
# quick-start.sh - Guía rápida para iniciar el proyecto

echo "🎮 Pico Park Multiplayer - Quick Start"
echo "======================================"
echo ""

echo "1️⃣  Instalando dependencias..."
npm install
cd Pico-Game && npm install && cd ..
cd Pico-Pad && npm install && cd ..

echo ""
echo "2️⃣  ✅ Instalación completada"
echo ""
echo "Para ejecutar:"
echo ""
echo "Terminal 1 - Servidor (en Pico-Game):"
echo "  cd Pico-Game"
echo "  npm start"
echo ""
echo "Terminal 2 - Juego (después de que el servidor esté listo):"
echo "  Abre: http://localhost:3000"
echo ""
echo "Terminal 3+ - Gamepads (1-4):"
echo "  cd Pico-Pad"
echo "  npm start"
echo "  npm run web"
echo ""
echo "📱 Conecta hasta 4 gamepads escaneando el QR o ingresando la IP del servidor"
