/**
 * GoDesc 360 - Microservidor Baileys WhatsApp Multi-Device + Webhook/Chatbot Sync
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

// Armazenamento em memória das conversas e mensagens recebidas do celular real
const incomingQueue = [];

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
      try {
        if (!m.messages || !m.messages[0]) return;
        const msg = m.messages[0];
        
        // Ignora mensagens enviadas por si mesmo no celular
        if (msg.key.fromMe) return;

        const senderJid = msg.key.remoteJid;
        if (!senderJid || senderJid.endsWith('@g.us')) return; // ignora grupos

        const senderPhone = senderJid.split('@')[0];
        const pushName = msg.pushName || '';
        // Nome com fallback caso pushName venha vazio
        const displayName = pushName.trim() || `Cliente (${senderPhone})`;
        const text = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     'Mensagem com mídia/anexo';

        console.log(`📩 Nova mensagem real do WhatsApp de [${displayName} - ${senderPhone}]: ${text}`);

        // Guarda na fila de sincronização para o frontend GoDesc 360
        incomingQueue.push({
          id: msg.key.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          phone: senderPhone,
          name: displayName,
          content: text,
          timestamp: new Date().toISOString()
        });

      } catch (err) {
        console.error('Erro ao processar mensagem recebida:', err);
      }
    });
  } catch (err) {
    console.error('Erro ao iniciar Baileys:', err);
  }
}

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

// Endpoint para buscar novas mensagens em tempo real no frontend
app.get('/api/sync-messages', (req, res) => {
  const messages = [...incomingQueue];
  incomingQueue.length = 0; // limpa a fila após entrega
  res.json({ messages });
});

// Endpoint para enviar mensagem do atendente de volta para o celular do cliente
app.post('/api/send-message', async (req, res) => {
  const { toPhone, text } = req.body;
  if (!sock || connectionStatus !== 'CONNECTED') {
    return res.status(400).json({ error: 'WhatsApp não está conectado!' });
  }

  try {
    // Remove tudo que não é dígito e monta o JID correto do WhatsApp
    const cleanPhone = toPhone.replace(/\D/g, '');
    const formattedPhone = `${cleanPhone}@s.whatsapp.net`;
    const sent = await sock.sendMessage(formattedPhone, { text });
    console.log(`📤 Mensagem enviada para [+${cleanPhone}]: ${text}`);
    res.json({ success: true, messageId: sent.key.id });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Baileys WhatsApp rodando na porta ${PORT}`);
});
