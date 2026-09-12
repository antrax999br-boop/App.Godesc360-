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
  fromName: 'GoDesc',
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

// Helper para localizar o arquivo de logotipo oficial
function getLogoAttachment() {
  const possiblePaths = [
    path.join(__dirname, 'logo-geral.png'),
    path.join(__dirname, '../public/logo-geral.png'),
    path.join(__dirname, 'public/logo-geral.png'),
    path.join(__dirname, '../Logo/logo geral.png')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return {
        filename: 'logo-godesc.png',
        path: p,
        cid: 'godesclogo'
      };
    }
  }
  return null;
}

// Helper para localizar o ícone oficial do WhatsApp
function getWhatsAppIconAttachment() {
  const possiblePaths = [
    path.join(__dirname, 'whatsapp-icon.png'),
    path.join(__dirname, '../public/whatsapp-icon.png'),
    path.join(__dirname, 'public/whatsapp-icon.png')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return {
        filename: 'whatsapp-icon.png',
        path: p,
        cid: 'whatsappicon'
      };
    }
  }
  return null;
}

// Template HTML de Alta Fidelidade (Card Escuro Premium com Contorno Branco Puro 100% compatível com Outlook e Webmail)
function buildEmailTemplate({ title, subtitle, badgeText, badgeBg, highlightTitle, highlightBody, contentHtml, ticketInfo }) {
  const currentYear = new Date().getFullYear();
  const remoteLogoFallback = 'https://raw.githubusercontent.com/antrax999br-boop/App.Godesc360-/main/public/logo-geral.png';

  let formattedTicketNumber = '#000000';
  if (ticketInfo) {
    if (ticketInfo.ticketNumber) {
      formattedTicketNumber = ticketInfo.ticketNumber;
    } else if (ticketInfo.id) {
      const idStr = String(ticketInfo.id);
      formattedTicketNumber = idStr.startsWith('#') ? idStr : `#${idStr.padStart(6, '0')}`;
    }
  }

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title || 'GoDesc'}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, span, h1, h2, h3 { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #ffffff !important; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  </style>
</head>
<body bgcolor="#ffffff" style="margin: 0; padding: 0; width: 100% !important; background-color: #ffffff !important; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <!-- Contorno do e-mail em branco puro dando destaque ao modelo do e-mail -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width: 100%; background-color: #ffffff !important; margin: 0; padding: 32px 10px;">
    <tr>
      <td align="center" bgcolor="#ffffff" style="background-color: #ffffff !important;">

        <!--[if mso]>
        <table width="600" border="0" cellpadding="0" cellspacing="0" align="center" bgcolor="#141824">
        <tr>
        <td bgcolor="#141824">
        <![endif]-->

        <!-- Card Central GoDesc 360 (Dark Premium com cantos arredondados) -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#141824" style="max-width: 600px; width: 100%; background-color: #141824 !important; border-radius: 16px; border: 1px solid #232d3f; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12); margin: 0 auto;">
          
          <!-- CABEÇALHO COM LOGO OFICIAL -->
          <tr>
            <td align="center" bgcolor="#0e121b" style="background-color: #0e121b !important; padding: 28px 24px 22px 24px; border-bottom: 1px solid #232d3f; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td align="center">
                    <a href="https://godesc.com.br" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="cid:godesclogo" onerror="this.src='${remoteLogoFallback}'" alt="GoDesc" width="180" style="display: block; width: 180px; max-width: 180px; height: auto; border: 0; margin: 0 auto;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <span style="font-size: 11px; font-weight: 700; color: #45dfa4; letter-spacing: 2px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      CENTRAL DE SUPORTE E ATENDIMENTO T.I.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTEÚDO DO CARD -->
          <tr>
            <td bgcolor="#141824" style="background-color: #141824 !important; padding: 28px 26px;">

              <!-- BADGE PILL DE STATUS -->
              ${badgeText ? `
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 16px 0;">
                <tr>
                  <td bgcolor="${badgeBg || '#f97316'}" style="background-color: ${badgeBg || '#f97316'} !important; border-radius: 20px; padding: 6px 16px; color: #ffffff !important; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                    ${badgeText}
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- TÍTULO PRINCIPAL -->
              <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700; color: #ffffff !important; line-height: 1.35; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                ${title}
              </h1>

              <!-- SAUDAÇÃO / SUBTÍTULO -->
              <p style="margin: 0 0 22px 0; font-size: 14px; color: #94a3b8 !important; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                ${subtitle}
              </p>

              <!-- CAIXA DE DESTAQUE (Motivo da Pausa / Nota do Analista / Parecer) -->
              ${(highlightTitle || highlightBody) ? `
              <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#19202e" style="width: 100%; background-color: #19202e !important; border-left: 4px solid ${badgeBg || '#f97316'}; border-radius: 0 8px 8px 0; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    ${highlightTitle ? `
                    <div style="font-size: 13px; font-weight: 700; color: ${badgeBg || '#f97316'}; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${highlightTitle}
                    </div>
                    ` : ''}
                    ${highlightBody ? `
                    <div style="font-size: 14px; color: #cbd5e1 !important; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${highlightBody}
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CONTEÚDO ADICIONAL SE HOUVER -->
              ${contentHtml ? `
              <div style="margin: 0 0 24px 0;">
                ${contentHtml}
              </div>
              ` : ''}

              <!-- TABELA DE DETALHES DO CHAMADO -->
              ${ticketInfo ? `
              <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#10141e" style="width: 100%; background-color: #10141e !important; border: 1px solid #232d3f; border-radius: 10px; margin: 0 0 8px 0; overflow: hidden;">
                <tr>
                  <td style="padding: 4px 0;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle" style="padding: 10px 18px; color: #8b949e !important; font-size: 13px; font-weight: 500; border-bottom: 1px solid #1c2433; width: 40%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Número do Chamado:
                        </td>
                        <td valign="middle" align="left" style="padding: 10px 18px; color: #45dfa4 !important; font-size: 14px; font-weight: 700; font-family: 'Courier New', Courier, monospace; border-bottom: 1px solid #1c2433; width: 60%;">
                          ${formattedTicketNumber}
                        </td>
                      </tr>
                      <tr>
                        <td valign="middle" style="padding: 10px 18px; color: #8b949e !important; font-size: 13px; font-weight: 500; border-bottom: 1px solid #1c2433; width: 40%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Assunto / Título:
                        </td>
                        <td valign="middle" align="left" style="padding: 10px 18px; color: #ffffff !important; font-size: 13px; font-weight: 600; border-bottom: 1px solid #1c2433; width: 60%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          ${ticketInfo.title || ticketInfo.subject || 'Chamado de Suporte'}
                        </td>
                      </tr>
                      <tr>
                        <td valign="middle" style="padding: 10px 18px; color: #8b949e !important; font-size: 13px; font-weight: 500; border-bottom: 1px solid #1c2433; width: 40%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Categoria:
                        </td>
                        <td valign="middle" align="left" style="padding: 10px 18px; color: #ffffff !important; font-size: 13px; font-weight: 600; border-bottom: 1px solid #1c2433; width: 60%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          ${ticketInfo.category || 'Geral'}${ticketInfo.subcategory ? ` &gt; ${ticketInfo.subcategory}` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td valign="middle" style="padding: 10px 18px; color: #8b949e !important; font-size: 13px; font-weight: 500; border-bottom: 1px solid #1c2433; width: 40%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Prioridade:
                        </td>
                        <td valign="middle" align="left" style="padding: 10px 18px; color: #ffffff !important; font-size: 13px; font-weight: 600; border-bottom: 1px solid #1c2433; width: 60%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          ${ticketInfo.priority || 'Média'}
                        </td>
                      </tr>
                      <tr>
                        <td valign="middle" style="padding: 10px 18px; color: #8b949e !important; font-size: 13px; font-weight: 500; ${ticketInfo.assignedTo ? 'border-bottom: 1px solid #1c2433;' : ''} width: 40%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Solicitante:
                        </td>
                        <td valign="middle" align="left" style="padding: 10px 18px; color: #ffffff !important; font-size: 13px; font-weight: 600; ${ticketInfo.assignedTo ? 'border-bottom: 1px solid #1c2433;' : ''} width: 60%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          ${ticketInfo.requesterName || 'Cliente'}
                        </td>
                      </tr>
                      ${ticketInfo.assignedTo ? `
                      <tr>
                        <td valign="middle" style="padding: 10px 18px; color: #8b949e !important; font-size: 13px; font-weight: 500; width: 40%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Técnico Responsável:
                        </td>
                        <td valign="middle" align="left" style="padding: 10px 18px; color: #ffffff !important; font-size: 13px; font-weight: 600; width: 60%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          ${ticketInfo.assignedTo}
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- RODAPÉ (FOOTER) -->
          <tr>
            <td align="center" bgcolor="#0e121b" style="background-color: #0e121b !important; padding: 26px 24px; border-top: 1px solid #232d3f; text-align: center;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #8b949e !important; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                Este é um e-mail automático gerado pelo sistema <strong style="color: #ffffff !important;">GoDesc</strong>
              </p>
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                Por favor, não responda diretamente a este e-mail.
              </p>
              <p style="margin: 0 0 16px 0; font-size: 11px; color: #475569 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                &copy; ${currentYear} GoDesc. Todos os direitos reservados.
              </p>

              <!-- WHATSAPP NUMBER COM ICONE OFICIAL EMBUTIDO (CID) -->
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" valign="middle" style="padding-right: 8px;">
                    <a href="https://wa.me/554733363233" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="cid:whatsappicon" onerror="this.src='https://raw.githubusercontent.com/antrax999br-boop/App.Godesc360-/main/public/whatsapp-icon.png'" alt="WhatsApp" width="22" height="22" style="display: block; width: 22px; height: 22px; border: 0;" />
                    </a>
                  </td>
                  <td align="center" valign="middle">
                    <a href="https://wa.me/554733363233" target="_blank" style="font-size: 17px; font-weight: 700; color: #45dfa4 !important; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; letter-spacing: 0.5px;">
                      3336-3233
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// Testa a conexão enviando um e-mail de verificação com layout idêntico ao modelo oficial
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

  const sampleTicket = {
    ticketNumber: '#000007',
    title: 'Teste de email',
    category: 'Software & Apps',
    subcategory: 'Office 365 / Outlook',
    priority: 'Média',
    requesterName: 'BleeyckINSIDER',
    assignedTo: cfg.fromName || 'Laercio Schumacher'
  };

  const html = buildEmailTemplate({
    title: 'O seu chamado foi pausado temporariamente',
    subtitle: `Olá <strong>${sampleTicket.requesterName}</strong>, informamos que o andamento do seu chamado foi pausado pelo analista.`,
    badgeText: 'CHAMADO PAUSADO',
    badgeBg: '#f97316',
    highlightTitle: 'Motivo da Pausa:',
    highlightBody: 'Aguardando informações adicionais ou peças necessárias.',
    ticketInfo: sampleTicket
  });

  const mailAttachments = [];
  const logoAtt = getLogoAttachment();
  if (logoAtt) mailAttachments.push(logoAtt);
  const waAtt = getWhatsAppIconAttachment();
  if (waAtt) mailAttachments.push(waAtt);

  const mailOptions = {
    from: `"${cfg.fromName || 'GoDesc'}" <${cfg.user}>`,
    to: recipient,
    subject: `⏸️ [GoDesc] Teste de E-mail - Chamado Pausado #000007`,
    html,
    attachments: mailAttachments
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
    return { success: false, reason: 'Credenciais de e-mail não configuradas no servidor' };
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
  let highlightTitle = '';
  let highlightBody = '';
  let contentHtml = '';
  let subjectPrefix = '';

  const ticketCode = ticket.ticketNumber || (ticket.id ? (String(ticket.id).startsWith('#') ? ticket.id : `#${String(ticket.id).padStart(6, '0')}`) : '#000001');

  switch (actionType) {
    case 'CREATED':
      subjectPrefix = `🆕 Chamado Registrado ${ticketCode}`;
      title = `Seu chamado foi registrado com sucesso!`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, recebemos sua solicitação e nossa equipe técnica já foi notificada.`;
      badgeText = 'CHAMADO REGISTRADO';
      badgeBg = '#2563eb';
      if (ticket.description) {
        highlightTitle = 'Descrição Informada:';
        highlightBody = ticket.description.replace(/\n/g, '<br/>');
      }
      break;

    case 'STARTED':
      subjectPrefix = `⚡ Atendimento Iniciado ${ticketCode}`;
      title = `O atendimento do seu chamado foi iniciado!`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, o analista <strong>${technicianName || ticket.assignedTo || 'de T.I.'}</strong> iniciou o atendimento do seu chamado.`;
      badgeText = 'EM ATENDIMENTO';
      badgeBg = '#f59e0b';
      if (note) {
        highlightTitle = 'Nota do Analista:';
        highlightBody = note.replace(/\n/g, '<br/>');
      }
      break;

    case 'PAUSED':
      subjectPrefix = `⏸️ Chamado Pausado ${ticketCode}`;
      title = `O seu chamado foi pausado temporariamente`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, informamos que o andamento do seu chamado foi pausado pelo analista.`;
      badgeText = 'CHAMADO PAUSADO';
      badgeBg = '#f97316';
      highlightTitle = 'Motivo da Pausa:';
      highlightBody = (note || 'Aguardando informações adicionais ou peças necessárias.').replace(/\n/g, '<br/>');
      break;

    case 'COMPLETED':
      subjectPrefix = `✅ Chamado Concluído ${ticketCode}`;
      title = `Seu chamado foi concluído com sucesso!`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, o atendimento do seu chamado foi finalizado pela nossa equipe de T.I.`;
      badgeText = 'CHAMADO CONCLUÍDO';
      badgeBg = '#10b981';
      if (note) {
        highlightTitle = 'Parecer Final / Resolução:';
        highlightBody = note.replace(/\n/g, '<br/>');
      }
      break;

    case 'MESSAGE_ADDED':
      subjectPrefix = `💬 Nova Mensagem no Chamado ${ticketCode}`;
      title = `Nova interação do analista no seu chamado`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, o técnico <strong>${technicianName || 'de T.I.'}</strong> enviou uma nova resposta.`;
      badgeText = 'NOVA MENSAGEM';
      badgeBg = '#8b5cf6';
      highlightTitle = 'Mensagem do Técnico:';
      highlightBody = (messageText || '').replace(/\n/g, '<br/>');

      if (attachments && attachments.length > 0) {
        contentHtml = `
          <div style="padding: 12px 16px; background-color: #19202e; border: 1px solid #232d3f; border-radius: 8px; font-size: 12px; color: #94a3b8; margin-top: 12px;">
            <strong style="color: #ffffff;">📎 Anexos enviados:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 20px;">
              ${attachments.map(a => `<li>${a.name || 'Arquivo'} (${a.size || ''})</li>`).join('')}
            </ul>
          </div>
        `;
      }
      break;

    case 'STATUS_CHANGED':
    default:
      const statusStyle = getStatusColor(ticket.status);
      subjectPrefix = `🔔 Atualização no Chamado ${ticketCode}: ${ticket.status}`;
      title = `Atualização de status no seu chamado`;
      subtitle = `Olá <strong>${ticket.requesterName || 'Cliente'}</strong>, o status do seu chamado mudou para <strong>${ticket.status}</strong>.`;
      badgeText = (statusStyle.label || 'ATUALIZADO').toUpperCase();
      badgeBg = statusStyle.bg;
      if (note) {
        highlightTitle = 'Observações:';
        highlightBody = note.replace(/\n/g, '<br/>');
      }
      break;
  }

  const html = buildEmailTemplate({
    title,
    subtitle,
    badgeText,
    badgeBg,
    highlightTitle,
    highlightBody,
    contentHtml,
    ticketInfo: ticket
  });

  const mailAttachments = [];
  const logoAtt = getLogoAttachment();
  if (logoAtt) mailAttachments.push(logoAtt);
  const waAtt = getWhatsAppIconAttachment();
  if (waAtt) mailAttachments.push(waAtt);

  if (attachments && Array.isArray(attachments)) {
    attachments.forEach((att, idx) => {
      if (att.url && (att.url.startsWith('http://') || att.url.startsWith('https://'))) {
        mailAttachments.push({
          filename: att.name || `anexo-${idx + 1}`,
          path: att.url
        });
      }
    });
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: `"${emailConfig.fromName || 'GoDesc'}" <${emailConfig.user}>`,
    to,
    subject: `${subjectPrefix} - ${ticket.title || ticket.subject || 'Suporte'}`,
    html,
    attachments: mailAttachments
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
