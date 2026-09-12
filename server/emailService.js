/**
 * GoDesc 360 - Serviço de Envio de E-mails via SMTP Corporativo (DescCloud @godesc.com.br) / Personalizado / Gmail
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'email_config.json');

// Configuração padrão (Provedor próprio GoDesc por padrão)
let emailConfig = {
  enabled: true,
  provider: 'godesc', // 'godesc' | 'custom' | 'gmail'
  smtpHost: 'mail.desccloud.com.br',
  smtpPort: 587,
  smtpSecure: false, // STARTTLS na porta 587
  imapHost: 'mail.desccloud.com.br',
  imapPort: 993,
  user: process.env.SMTP_USER || process.env.GMAIL_USER || '',
  pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASS || '',
  fromName: 'GoDesc 360 Service Desk',
  notifyOnCreate: true,
  notifyOnStatusChange: true,
  notifyOnMessage: true
};

// Carrega configurações persistidas se existirem
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      emailConfig = { ...emailConfig, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Erro ao ler email_config.json:', err);
  }
}

// Salva configurações no disco
function saveConfig(newConfig) {
  try {
    emailConfig = { ...emailConfig, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(emailConfig, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Erro ao salvar email_config.json:', err);
    return false;
  }
}

loadConfig();

// Cria o transporter Nodemailer dinâmico
function createTransporter(customConfig) {
  const cfg = customConfig || emailConfig;
  const rawPass = (cfg.pass || '').trim();
  const provider = cfg.provider || (cfg.service === 'gmail' ? 'gmail' : 'godesc');

  if (provider === 'gmail') {
    const cleanPass = rawPass.replace(/\s+/g, ''); // Remove espaços da senha de app do Google
    return nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: (cfg.user || '').trim(),
        pass: cleanPass
      }
    });
  }

  // GoDesc Oficial DescCloud ou SMTP Personalizado
  const host = (cfg.smtpHost || (provider === 'godesc' ? 'mail.desccloud.com.br' : 'mail.desccloud.com.br')).trim();
  const port = Number(cfg.smtpPort) || 587;
  const isSecure = cfg.smtpSecure !== undefined ? Boolean(cfg.smtpSecure) : (port === 465);

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: isSecure, // true para SSL porta 465, false para STARTTLS porta 587
    auth: {
      user: (cfg.user || '').trim(),
      pass: rawPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Retorna cores por status
function getStatusColor(status) {
  switch (status) {
    case 'Novo':
      return { bg: '#3b82f6', text: '#ffffff', label: 'Novo' };
    case 'Em Andamento':
      return { bg: '#f59e0b', text: '#ffffff', label: 'Em Atendimento' };
    case 'Pausado':
      return { bg: '#f97316', text: '#ffffff', label: 'Pausado' };
    case 'Concluído':
    case 'Fechado':
      return { bg: '#10b981', text: '#ffffff', label: 'Concluído' };
    case 'Cancelado':
      return { bg: '#ef4444', text: '#ffffff', label: 'Cancelado' };
    default:
      return { bg: '#6b7280', text: '#ffffff', label: status || 'Atualizado' };
  }
}

// Template HTML moderno e responsivo
function buildEmailTemplate({ title, subtitle, badgeText, badgeBg, contentHtml, ticketInfo }) {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0e1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #161b22; border-radius: 12px; border: 1px solid #30363d; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 24px; text-align: center; border-bottom: 1px solid #30363d; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; font-family: monospace; }
    .body { padding: 28px 24px; }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; background-color: ${badgeBg || '#45dfa4'}; color: #ffffff; }
    .headline { font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 8px 0; }
    .subheadline { font-size: 14px; color: #94a3b8; margin: 0 0 20px 0; line-height: 1.5; }
    .card-info { background-color: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #21262d; font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #8b949e; font-weight: 500; }
    .info-value { color: #f0f6fc; font-weight: 600; text-align: right; }
    .message-box { background-color: #1c2128; border-left: 4px solid #45dfa4; border-radius: 0 8px 8px 0; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #e6edf3; }
    .footer { background-color: #0d1117; padding: 20px; text-align: center; border-top: 1px solid #21262d; font-size: 12px; color: #8b949e; line-height: 1.5; }
    .footer a { color: #45dfa4; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GoDesc 360 Service Desk</h1>
      <p>CENTRAL DE SUPORTE E ATENDIMENTO T.I.</p>
    </div>

    <div class="body">
      ${badgeText ? `<div class="badge">${badgeText}</div>` : ''}
      <h2 class="headline">${title}</h2>
      <p class="subheadline">${subtitle}</p>

      ${contentHtml || ''}

      ${ticketInfo ? `
      <div class="card-info">
        <div class="info-row">
          <span class="info-label">Número do Chamado:</span>
          <span class="info-value" style="color: #45dfa4; font-family: monospace;">${ticketInfo.ticketNumber || '#000000'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Assunto / Título:</span>
          <span class="info-value">${ticketInfo.title || ticketInfo.subject || 'Suporte'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Categoria:</span>
          <span class="info-value">${ticketInfo.category || 'Geral'}${ticketInfo.subcategory ? ` > ${ticketInfo.subcategory}` : ''}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Prioridade:</span>
          <span class="info-value">${ticketInfo.priority || 'Média'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Solicitante:</span>
          <span class="info-value">${ticketInfo.requesterName || 'Cliente'}</span>
        </div>
        ${ticketInfo.assignedTo ? `
        <div class="info-row">
          <span class="info-label">Técnico Responsável:</span>
          <span class="info-value">${ticketInfo.assignedTo}</span>
        </div>` : ''}
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <p>Este é um e-mail automático gerado pelo sistema <strong>GoDesc 360 Service Desk</strong>.</p>
      <p>Por favor, não responda diretamente a este e-mail.</p>
      <p style="margin-top: 10px; color: #6e7681;">&copy; ${currentYear} GoDesc 360. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`;
}

// Testa a conexão enviando um e-mail de verificação
async function testConnection(customConfig, targetEmail) {
  const cfg = {
    ...emailConfig,
    ...(customConfig || {}),
    pass: (customConfig && customConfig.pass) ? customConfig.pass : emailConfig.pass
  };
  if (!cfg.user || !cfg.pass) {
    throw new Error('E-mail e Senha são obrigatórios para testar a conexão.');
  }

  const transporter = createTransporter(cfg);
  const recipient = targetEmail || cfg.user;
  const provider = cfg.provider || (cfg.service === 'gmail' ? 'gmail' : 'godesc');

  const providerLabel = provider === 'godesc' 
    ? 'GoDesc (@godesc.com.br - DescCloud)' 
    : (provider === 'gmail' ? 'Gmail SMTP' : `SMTP Personalizado (${cfg.smtpHost || 'Personalizado'})`);

  const hostDisplay = provider === 'gmail' ? 'smtp.gmail.com:465' : `${cfg.smtpHost || 'mail.desccloud.com.br'}:${cfg.smtpPort || 587}`;

  const html = buildEmailTemplate({
    title: '✅ Conexão de E-mail Estabelecida com Sucesso!',
    subtitle: `Seu sistema GoDesc 360 agora está autenticado via ${providerLabel} e pronto para disparar notificações aos clientes.`,
    badgeText: 'INTEGRAÇÃO ATIVA',
    badgeBg: '#10b981',
    contentHtml: `
      <div class="message-box" style="border-left-color: #10b981;">
        <p style="margin: 0; font-weight: 600;">Autenticação Concluída com Sucesso!</p>
        <p style="margin: 8px 0 0 0;">O teste de autenticação SMTP com o servidor <strong>${hostDisplay}</strong> foi concluído com êxito utilizando a conta <strong>${cfg.user}</strong>.</p>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8;">A partir de agora, os seus clientes serão notificados por e-mail automaticamente a cada abertura, mudança de status e resposta nos chamados através do seu e-mail corporativo.</p>
      </div>
    `
  });

  const mailOptions = {
    from: `"${cfg.fromName || 'GoDesc 360 Service Desk'}" <${cfg.user}>`,
    to: recipient,
    subject: `🧪 [GoDesc 360] Teste de Conexão SMTP Realizado com Sucesso (${providerLabel})`,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  return { 
    success: true, 
    messageId: info.messageId, 
    recipient,
    provider: providerLabel,
    server: hostDisplay
  };
}

// Dispara e-mail de notificação de chamado
async function sendTicketNotification({ to, actionType, ticket, technicianName, note, messageText, attachments }) {
  if (!emailConfig.enabled) {
    return { success: false, reason: 'Envio de e-mails desativado nas configurações' };
  }

  if (!emailConfig.user || !emailConfig.pass) {
    return { success: false, reason: 'Gmail não configurado no servidor' };
  }

  if (!to || !to.includes('@')) {
    return { success: false, reason: 'E-mail do solicitante ausente ou inválido' };
  }

  // Checa filtros configurados
  if (actionType === 'CREATED' && !emailConfig.notifyOnCreate) return { success: false, reason: 'notifyOnCreate desligado' };
  if ((actionType === 'STATUS_CHANGED' || actionType === 'STARTED' || actionType === 'PAUSED' || actionType === 'COMPLETED') && !emailConfig.notifyOnStatusChange) return { success: false, reason: 'notifyOnStatusChange desligado' };
  if (actionType === 'MESSAGE_ADDED' && !emailConfig.notifyOnMessage) return { success: false, reason: 'notifyOnMessage desligado' };

  let title = '';
  let subtitle = '';
  let badgeText = '';
  let badgeBg = '#45dfa4';
  let contentHtml = '';
  let subjectPrefix = '';

  const ticketCode = ticket.ticketNumber || `#${ticket.id || ''}`;

  switch (actionType) {
    case 'CREATED':
      subjectPrefix = `🆕 Chamado Registrado ${ticketCode}`;
      title = `Seu chamado foi registrado com sucesso!`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, recebemos sua solicitação e nossa equipe técnica já foi notificada.`;
      badgeText = 'CHAMADO ABERTO';
      badgeBg = '#3b82f6';
      if (ticket.description) {
        contentHtml = `
          <p style="font-size: 13px; color: #8b949e; margin-bottom: 6px;">Descrição informada:</p>
          <div class="message-box" style="border-left-color: #3b82f6;">
            ${ticket.description.replace(/\n/g, '<br/>')}
          </div>
        `;
      }
      break;

    case 'STARTED':
      subjectPrefix = `⚡ Atendimento Iniciado ${ticketCode}`;
      title = `O atendimento do seu chamado foi iniciado!`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, o analista <strong>${technicianName || ticket.assignedTo || 'de T.I.'}</strong> iniciou o atendimento do seu chamado.`;
      badgeText = 'EM ATENDIMENTO';
      badgeBg = '#f59e0b';
      if (note) {
        contentHtml = `
          <div class="message-box" style="border-left-color: #f59e0b;">
            <strong>Nota do Analista:</strong><br/>
            ${note.replace(/\n/g, '<br/>')}
          </div>
        `;
      }
      break;

    case 'PAUSED':
      subjectPrefix = `⏸️ Chamado Pausado ${ticketCode}`;
      title = `O seu chamado foi pausado temporariamente`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, informamos que o andamento do seu chamado foi pausado pelo analista.`;
      badgeText = 'CHAMADO PAUSADO';
      badgeBg = '#f97316';
      contentHtml = `
        <div class="message-box" style="border-left-color: #f97316;">
          <strong style="color: #f97316;">Motivo da Pausa:</strong><br/>
          ${(note || 'Aguardando informações adicionais ou peças necessárias.').replace(/\n/g, '<br/>')}
        </div>
      `;
      break;

    case 'COMPLETED':
      subjectPrefix = `✅ Chamado Concluído ${ticketCode}`;
      title = `Seu chamado foi concluído com sucesso!`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, o atendimento do seu chamado foi finalizado pela nossa equipe de T.I.`;
      badgeText = 'CONCLUÍDO';
      badgeBg = '#10b981';
      if (note) {
        contentHtml = `
          <div class="message-box" style="border-left-color: #10b981;">
            <strong>Parecer Final / Resolução:</strong><br/>
            ${note.replace(/\n/g, '<br/>')}
          </div>
        `;
      }
      break;

    case 'MESSAGE_ADDED':
      subjectPrefix = `💬 Nova Mensagem no Chamado ${ticketCode}`;
      title = `Nova interação do analista no seu chamado`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, o técnico <strong>${technicianName || 'de T.I.'}</strong> enviou uma nova resposta.`;
      badgeText = 'NOVA MENSAGEM';
      badgeBg = '#8b5cf6';
      
      let attHtml = '';
      if (attachments && attachments.length > 0) {
        attHtml = `
          <div style="margin-top: 12px; font-size: 12px; color: #94a3b8;">
            <strong>📎 Anexos enviados:</strong>
            <ul style="margin: 4px 0; padding-left: 20px;">
              ${attachments.map(a => `<li>${a.name || 'Arquivo'} (${a.size || ''})</li>`).join('')}
            </ul>
          </div>
        `;
      }

      contentHtml = `
        <div class="message-box" style="border-left-color: #8b5cf6;">
          <strong>Mensagem do Técnico:</strong><br/>
          ${(messageText || '').replace(/\n/g, '<br/>')}
          ${attHtml}
        </div>
      `;
      break;

    case 'STATUS_CHANGED':
    default:
      const statusStyle = getStatusColor(ticket.status);
      subjectPrefix = `🔔 Atualização no Chamado ${ticketCode}: ${ticket.status}`;
      title = `Atualização de status no seu chamado`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, o status do seu chamado mudou para <strong>${ticket.status}</strong>.`;
      badgeText = statusStyle.label;
      badgeBg = statusStyle.bg;
      if (note) {
        contentHtml = `
          <div class="message-box" style="border-left-color: ${statusStyle.bg};">
            <strong>Observações do Técnico:</strong><br/>
            ${note.replace(/\n/g, '<br/>')}
          </div>
        `;
      }
      break;
  }

  const html = buildEmailTemplate({
    title,
    subtitle,
    badgeText,
    badgeBg,
    contentHtml,
    ticketInfo: ticket
  });

  const transporter = createTransporter();
  const mailOptions = {
    from: `"${emailConfig.fromName || 'GoDesc 360 Service Desk'}" <${emailConfig.user}>`,
    to,
    subject: `${subjectPrefix} - ${ticket.title || ticket.subject || 'Suporte'}`,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 E-mail de chamado [${actionType}] enviado para ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`Erro ao enviar e-mail de chamado para ${to}:`, err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  getEmailConfig: () => {
    // Retorna cópia sem expor a senha completa
    const safePass = emailConfig.pass ? '••••••••••••••••' : '';
    return {
      ...emailConfig,
      hasPassword: !!emailConfig.pass,
      passMasked: safePass
    };
  },
  saveConfig,
  testConnection,
  sendTicketNotification
};
