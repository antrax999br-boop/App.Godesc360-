/**
 * GoDesc 360 - Microservidor Baileys WhatsApp Multi-Device
 * 
 * Este servidor Node.js roda o motor oficial do Baileys para gerar o QR Code oficial
 * e manter a sessão conectada ao WhatsApp Web 24/7.
 * 
 * Para rodar localmente:
 * 1. cd server
 * 2. npm install
 * 3. node index.js
 * 
 * Para hospedar gratuitamente (Railway.app, Render.com ou Fly.io):
 * 1. Suba esta pasta ou repositório no GitHub.
 * 2. Crie um Web Service no Render/Railway apontando para esta pasta.
 * 3. Configure a variável VITE_WHATSAPP_API_URL no Vercel com a URL gerada!
 */

const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

let sock = null;
let qrCodeBase64 = null;
let connectionStatus = 'DISCONNECTED';
let connectedPhone = null;

async function startBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      connectionStatus = 'WAITING_QR';
      qrCodeBase64 = await QRCode.toDataURL(qr);
      console.log('⚡ Novo QR Code oficial do WhatsApp gerado!');
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      connectionStatus = 'DISCONNECTED';
      qrCodeBase64 = null;
      console.log('🔴 Conexão fechada. Reconectando...', shouldReconnect);
      if (shouldReconnect) {
        startBaileys();
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
    // Aqui a mensagem recebida pode ser gravada diretamente no Supabase!
  });
}

// Endpoint para buscar o status da sessão
app.get('/api/status', (req, res) => {
  res.json({
    status: connectionStatus,
    phoneNumber: connectedPhone,
    updatedAt: new Date().toISOString()
  });
});

// Endpoint para gerar/buscar o QR Code oficial
app.get('/api/qr', async (req, res) => {
  if (connectionStatus === 'DISCONNECTED' && !sock) {
    await startBaileys();
  }
  
  res.json({
    status: connectionStatus,
    qrCode: qrCodeBase64,
    phoneNumber: connectedPhone
  });
});

// Endpoint para enviar mensagem
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
