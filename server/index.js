/**
 * GoDesc 360 - Microservidor Baileys WhatsApp Multi-Device + Webhook/Chatbot Sync
 */

const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
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
        console.log('🔴 Conexão encerrada. Reconectando...', shouldReconnect, 'StatusCode:', statusCode);
        if (!shouldReconnect) {
          try {
            fs.rmSync('baileys_auth_info', { recursive: true, force: true });
          } catch (e) {}
          setTimeout(() => startBaileys(), 2000);
        } else {
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
        if (!m.messages || !m.messages.length) return;
        // Filtra apenas mensagens em tempo real (ignora sync de histórico append)
        if (m.type && m.type !== 'notify') return;

        for (const msg of m.messages) {
          // Ignora mensagens enviadas por mim no próprio celular
          if (msg.key.fromMe) continue;

          const senderJid = msg.key.remoteJid;
          if (!senderJid || senderJid.endsWith('@g.us') || senderJid === 'status@broadcast') continue;

          const senderPhone = senderJid.split('@')[0];
          const pushName = msg.pushName || '';
          const displayName = pushName.trim() || `Cliente (+${senderPhone})`;

          // Desempacota mensagens efêmeras (disappearing messages), viewOnce e mídias
          const actualMessage = msg.message?.ephemeralMessage?.message 
            || msg.message?.viewOnceMessage?.message 
            || msg.message?.viewOnceMessageV2?.message 
            || msg.message?.documentWithCaptionMessage?.message
            || msg.message;

          if (!actualMessage) continue;

          const text = actualMessage?.conversation 
            || actualMessage?.extendedTextMessage?.text 
            || actualMessage?.imageMessage?.caption 
            || actualMessage?.videoMessage?.caption 
            || actualMessage?.documentMessage?.caption
            || (actualMessage?.audioMessage ? '🎵 Mensagem de Áudio' : null)
            || (actualMessage?.stickerMessage ? '🎨 Figurinha' : null)
            || (actualMessage?.contactMessage ? '👤 Contato' : null)
            || (actualMessage?.locationMessage ? '📍 Localização' : null)
            || null;

          if (!text) continue;

          console.log(`📩 Nova mensagem real do WhatsApp de [${displayName} - ${senderPhone}]: ${text}`);

          const timestampNum = msg.messageTimestamp 
            ? (typeof msg.messageTimestamp === 'number' ? msg.messageTimestamp : msg.messageTimestamp.low || Date.now() / 1000)
            : Date.now() / 1000;

          incomingQueue.push({
            id: msg.key.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            phone: senderPhone,
            name: displayName,
            content: text,
            timestamp: new Date(timestampNum * 1000).toISOString()
          });
        }
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
    return res.status(400).json({ error: 'WhatsApp não está conectado no servidor!' });
  }

  try {
    const cleanPhone = toPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      return res.status(400).json({ error: 'Número de telefone inválido' });
    }

    // Resolve o JID exato no WhatsApp (resolve variação do 9º dígito no Brasil)
    let targetJid = `${cleanPhone}@s.whatsapp.net`;
    try {
      const [onWa] = await sock.onWhatsApp(cleanPhone);
      if (onWa && onWa.exists && onWa.jid) {
        targetJid = onWa.jid;
      } else if (cleanPhone.startsWith('55') && cleanPhone.length === 13 && cleanPhone[4] === '9') {
        // Tenta sem o 9º dígito adicional
        const phoneWithout9 = cleanPhone.slice(0, 4) + cleanPhone.slice(5);
        const [onWaAlt] = await sock.onWhatsApp(phoneWithout9);
        if (onWaAlt && onWaAlt.exists && onWaAlt.jid) {
          targetJid = onWaAlt.jid;
        }
      } else if (cleanPhone.startsWith('55') && cleanPhone.length === 12) {
        // Tenta adicionando o 9º dígito
        const phoneWith9 = cleanPhone.slice(0, 4) + '9' + cleanPhone.slice(4);
        const [onWaAlt] = await sock.onWhatsApp(phoneWith9);
        if (onWaAlt && onWaAlt.exists && onWaAlt.jid) {
          targetJid = onWaAlt.jid;
        }
      }
    } catch (e) {
      console.warn('Checagem onWhatsApp falhou, utilizando JID padrão:', e);
    }

    const sent = await sock.sendMessage(targetJid, { text });
    console.log(`📤 Mensagem enviada com sucesso para [${targetJid}]: ${text}`);
    res.json({ success: true, messageId: sent.key.id, jid: targetJid });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    res.status(500).json({ error: err.message || 'Falha ao enviar mensagem pelo WhatsApp' });
  }
});

// Endpoint para desconectar WhatsApp e resetar a sessão
app.post('/api/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout().catch(() => {});
      sock.end(undefined);
      sock = null;
    }
    connectionStatus = 'DISCONNECTED';
    qrCodeBase64 = null;
    connectedPhone = null;
    try {
      fs.rmSync('baileys_auth_info', { recursive: true, force: true });
    } catch (e) {}
    console.log('🔴 Sessão WhatsApp encerrada pelo usuário.');
    res.json({ success: true, message: 'WhatsApp desconectado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Baileys WhatsApp rodando na porta ${PORT}`);
});

