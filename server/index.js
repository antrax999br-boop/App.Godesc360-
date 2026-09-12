/**
 * GoDesc 360 - Microservidor Baileys WhatsApp Multi-Device + Webhook/Chatbot Sync
 */

const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const { makeWASocket, useMultiFileAuthState, DisconnectReason, jidNormalizedUser } = require('@whiskeysockets/baileys');
const emailService = require('./emailService');


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

let sock = null;
let qrCodeBase64 = null;
let connectionStatus = 'DISCONNECTED';
let connectedPhone = null;
let isStarting = false;

// Armazenamento em memória das conversas e mensagens recebidas do celular real
const incomingQueue = [];

async function startBaileys() {
  if (isStarting) return;
  isStarting = true;

  try {
    if (sock) {
      try {
        sock.ev.removeAllListeners();
        sock.end(undefined);
      } catch (e) {}
      sock = null;
    }

    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['GoDesc 360 Service Desk', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      keepAliveIntervalMs: 30000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      patchMessageBeforeSending: (message) => {
        const requiresPatch = !!(
          message.buttonsMessage ||
          message.templateMessage ||
          message.listMessage
        );
        if (requiresPatch) {
          message = {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadataVersion: 2,
                  deviceListMetadata: {},
                },
                ...message,
              },
            },
          };
        }
        return message;
      }
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
        
        isStarting = false;
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
        isStarting = false;
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
            jid: senderJid,
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
    isStarting = false;
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

// Helper para obter JID válido do WhatsApp considerando 9º dígito BR
async function resolveJid(toPhone) {
  if (!toPhone) return null;

  // Se já for o JID exato recebido do WhatsApp (ex: 5545999887766@s.whatsapp.net), normaliza removendo device ID
  if (typeof toPhone === 'string' && toPhone.includes('@')) {
    return jidNormalizedUser(toPhone);
  }
  let clean = toPhone.replace(/\D/g, '');
  if (!clean) return null;

  // Se o número tiver 10 ou 11 dígitos e não começar com 55 (DDI Brasil), adiciona 55
  if ((clean.length === 10 || clean.length === 11) && !clean.startsWith('55')) {
    clean = '55' + clean;
  }

  let targetJid = jidNormalizedUser(`${clean}@s.whatsapp.net`);
  if (!sock) return targetJid;

  try {
    const onWa = await sock.onWhatsApp(clean);
    if (onWa && onWa.length > 0 && onWa[0].exists && onWa[0].jid) {
      return jidNormalizedUser(onWa[0].jid);
    }

    if (clean.startsWith('55') && clean.length === 13 && clean[4] === '9') {
      // Tenta sem o 9º dígito
      const without9 = clean.slice(0, 4) + clean.slice(5);
      const onWaAlt = await sock.onWhatsApp(without9);
      if (onWaAlt && onWaAlt.length > 0 && onWaAlt[0].exists && onWaAlt[0].jid) {
        return jidNormalizedUser(onWaAlt[0].jid);
      }
    } else if (clean.startsWith('55') && clean.length === 12) {
      // Tenta com o 9º dígito
      const with9 = clean.slice(0, 4) + '9' + clean.slice(4);
      const onWaAlt = await sock.onWhatsApp(with9);
      if (onWaAlt && onWaAlt.length > 0 && onWaAlt[0].exists && onWaAlt[0].jid) {
        return jidNormalizedUser(onWaAlt[0].jid);
      }
    }
  } catch (e) {
    console.warn('⚠️ Verification onWhatsApp failed, using default JID:', e);
  }

  return targetJid;
}

// Endpoint para enviar mensagem do atendente ou chatbot para o cliente
app.post('/api/send-message', async (req, res) => {
  const { toPhone, text } = req.body;

  if (!toPhone || !text) {
    return res.status(400).json({ error: 'Parâmetros toPhone e text são obrigatórios.' });
  }

  // Se a conexão estiver reconectando, aguarda até 5s
  let waitCount = 0;
  while (connectionStatus !== 'CONNECTED' && waitCount < 10) {
    await new Promise(r => setTimeout(r, 500));
    waitCount++;
  }

  if (!sock || connectionStatus !== 'CONNECTED') {
    return res.status(400).json({ error: 'WhatsApp não está conectado no servidor!' });
  }

  try {
    const targetJid = await resolveJid(toPhone);
    if (!targetJid) {
      return res.status(400).json({ error: 'Número de telefone inválido' });
    }

    const sent = await sock.sendMessage(targetJid, { text });
    console.log(`📤 Mensagem enviada com sucesso para [${targetJid}]: ${text}`);
    res.json({ success: true, messageId: sent.key.id, jid: targetJid });
  } catch (err) {
    console.error('Erro ao enviar mensagem via Baileys:', err);
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

// ==========================================
// ENDPOINTS DE E-MAIL (SMTP CORPORATIVO GoDesc / PERSONALIZADO / GMAIL)
// ==========================================

// Retorna configurações atuais do e-mail
app.get('/api/email/config', (req, res) => {
  res.json(emailService.getEmailConfig());
});

// Salva novas credenciais e preferências de e-mail
app.post('/api/email/config', (req, res) => {
  const {
    user, pass, fromName, enabled,
    provider, smtpHost, smtpPort, smtpSecure,
    imapHost, imapPort,
    notifyOnCreate, notifyOnStatusChange, notifyOnMessage
  } = req.body;
  const updateData = {};

  // Credenciais básicas
  if (user !== undefined) updateData.user = user.trim();
  if (pass !== undefined && pass !== '') updateData.pass = pass.trim();
  if (fromName !== undefined) updateData.fromName = fromName.trim();
  if (enabled !== undefined) updateData.enabled = !!enabled;

  // Provedor e servidor SMTP/IMAP
  if (provider !== undefined) updateData.provider = provider;
  if (smtpHost !== undefined && smtpHost !== '') updateData.smtpHost = smtpHost.trim();
  if (smtpPort !== undefined) updateData.smtpPort = Number(smtpPort);
  if (smtpSecure !== undefined) updateData.smtpSecure = !!smtpSecure;
  if (imapHost !== undefined && imapHost !== '') updateData.imapHost = imapHost.trim();
  if (imapPort !== undefined) updateData.imapPort = Number(imapPort);

  // Notificações
  if (notifyOnCreate !== undefined) updateData.notifyOnCreate = !!notifyOnCreate;
  if (notifyOnStatusChange !== undefined) updateData.notifyOnStatusChange = !!notifyOnStatusChange;
  if (notifyOnMessage !== undefined) updateData.notifyOnMessage = !!notifyOnMessage;

  const saved = emailService.saveConfig(updateData);
  if (saved) {
    res.json({ success: true, config: emailService.getEmailConfig() });
  } else {
    res.status(500).json({ error: 'Erro ao salvar configurações de e-mail.' });
  }
});

// Testa conexão SMTP enviando um e-mail de verificação
app.post('/api/email/test', async (req, res) => {
  const { user, pass, fromName, provider, smtpHost, smtpPort, smtpSecure, testRecipient } = req.body;
  try {
    const customConfig = {};
    if (user) customConfig.user = user;
    if (pass) customConfig.pass = pass;
    if (fromName) customConfig.fromName = fromName;
    if (provider) customConfig.provider = provider;
    if (smtpHost) customConfig.smtpHost = smtpHost;
    if (smtpPort) customConfig.smtpPort = smtpPort;
    if (smtpSecure !== undefined) customConfig.smtpSecure = smtpSecure;

    const result = await emailService.testConnection(Object.keys(customConfig).length > 0 ? customConfig : null, testRecipient);
    res.json(result);
  } catch (err) {
    console.error('Falha no teste de e-mail:', err);
    res.status(400).json({ error: err.message || 'Falha ao conectar com o servidor de e-mail' });
  }
});

// Dispara e-mail de notificação de chamado
app.post('/api/email/notify', async (req, res) => {
  const { to, actionType, ticket, technicianName, note, messageText, attachments } = req.body;
  if (!to || !ticket) {
    return res.status(400).json({ error: 'Parâmetros "to" e "ticket" são obrigatórios.' });
  }

  try {
    const result = await emailService.sendTicketNotification({
      to,
      actionType,
      ticket,
      technicianName,
      note,
      messageText,
      attachments
    });
    res.json(result);
  } catch (err) {
    console.error('Erro na rota de notificação de chamado:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Baileys WhatsApp rodando na porta ${PORT}`);
});
