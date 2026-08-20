/**
 * GoDesc 360 - Microservidor Baileys WhatsApp Multi-Device
 */

const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

let sock = null;
let qrCodeBase64 = null;
let connectionStatus = 'DISCONNECTED';
let connectedPhone = null;

async function startBaileys() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['GoDesc 360 Service Desk', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'WAITING_QR';
        qrCodeBase64 = await QRCode.toDataURL(qr);
        console.log('⚡ QR Code oficial do WhatsApp gerado com sucesso!');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        connectionStatus = 'DISCONNECTED';
        qrCodeBase64 = null;
        console.log('🔴 Conexão encerrada. Reconectando...', shouldReconnect);
        if (shouldReconnect) {
          setTimeout(() => startBaileys(), 3000);
        }
      } else if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        qrCodeBase64 = null;
        connectedPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Conectado';
        console.log('🟢 WhatsApp conectado com sucesso! Número:', connectedPhone);
      }
    });

    sock.ev.on('messages.upsert', async (m) => {
      console.log('📩 Nova mensagem recebida do WhatsApp:', JSON.stringify(m, null, 2));
    });
  } catch (err) {
    console.error('Erro ao iniciar Baileys:', err);
  }
}

// Inicia o motor Baileys imediatamente na subida do servidor
startBaileys();

app.get('/api/status', (req, res) => {
  res.json({
    status: connectionStatus,
    phoneNumber: connectedPhone,
    updatedAt: new Date().toISOString()
  });
});

app.get('/api/qr', async (req, res) => {
  if (!sock) {
    await startBaileys();
  }

  // Se o QR Code ainda está sendo gerado pelo WhatsApp, aguarda até 5 segundos
  let attempts = 0;
  while (!qrCodeBase64 && connectionStatus !== 'CONNECTED' && attempts < 10) {
    await new Promise(r => setTimeout(r, 500));
    attempts++;
  }

  res.json({
    status: connectionStatus,
    qrCode: qrCodeBase64,
    phoneNumber: connectedPhone
  });
});

app.post('/api/send-message', async (req, res) => {
  const { toPhone, text } = req.body;
  if (!sock || connectionStatus !== 'CONNECTED') {
    return res.status(400).json({ error: 'WhatsApp não está conectado!' });
  }

  try {
    const formattedPhone = `${toPhone.replace(/\D/g, '')}@s.whatsapp.net`;
    const sent = await sock.sendMessage(formattedPhone, { text });
    res.json({ success: true, messageId: sent.key.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Baileys WhatsApp rodando na porta ${PORT}`);
});
