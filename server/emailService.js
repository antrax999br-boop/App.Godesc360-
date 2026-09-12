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

// Template HTML de Alta Fidelidade (Dark Theme Black 100% compatível com Outlook, Apple Mail e Gmail)
function buildEmailTemplate({ title, subtitle, badgeText, badgeBg, contentHtml, ticketInfo }) {
  const currentYear = new Date().getFullYear();
  const remoteLogoFallback = 'https://raw.githubusercontent.com/antrax999br-boop/App.Godesc360-/main/public/logo-geral.png';

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark only" />
  <meta name="supported-color-schemes" content="dark only" />
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, span { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: dark only; supported-color-schemes: dark only; }
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #06080d !important; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  </style>
</head>
<body bgcolor="#06080d" style="margin: 0; padding: 0; background-color: #06080d !important; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <!-- Outer Table Wrapper (Fundo Preto Total) -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#06080d" style="width: 100%; background-color: #06080d !important; margin: 0; padding: 24px 0;">
    <tr>
      <td align="center" bgcolor="#06080d" style="background-color: #06080d !important; padding: 0 12px;">
        
        <!-- Main Container Card (Fundo Escuro Premium) -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#0f131a" style="max-width: 600px; width: 100%; background-color: #0f131a !important; border-radius: 12px; border: 1px solid #232938; overflow: hidden;">
          
          <!-- HEADER COM A LOGO OFICIAL DA GODESC -->
          <tr>
            <td align="center" bgcolor="#0a0d13" style="background-color: #0a0d13 !important; padding: 28px 24px 22px 24px; border-bottom: 1px solid #232938; text-align: center;">
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
                    <span style="font-size: 11px; font-weight: 700; color: #45dfa4; letter-spacing: 1.5px; text-transform: uppercase; font-family: monospace;">
                      CENTRAL DE SUPORTE E ATENDIMENTO T.I.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td bgcolor="#0f131a" style="background-color: #0f131a !important; padding: 28px 24px;">

              <!-- BADGE DE STATUS -->
              ${badgeText ? `
              <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td bgcolor="${badgeBg || '#45dfa4'}" style="background-color: ${badgeBg || '#45dfa4'} !important; border-radius: 20px; padding: 5px 14px; color: #ffffff !important; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                    ${badgeText}
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- TITULO E SUBTITULO -->
              <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #ffffff !important; line-height: 1.3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                ${title}
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8 !important; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                ${subtitle}
              </p>

              <!-- CAIXA DE MENSAGEM / NOTA / CONTEUDO (Com barra lateral colorida) -->
              ${contentHtml ? `
              <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#151a24" style="background-color: #151a24 !important; border: 1px solid #232938; border-radius: 8px; margin: 18px 0; overflow: hidden;">
                <tr>
                  <td width="4" bgcolor="${badgeBg || '#45dfa4'}" style="background-color: ${badgeBg || '#45dfa4'} !important; width: 4px; font-size: 1px; line-height: 1px;">&nbsp;</td>
                  <td bgcolor="#151a24" style="background-color: #151a24 !important; padding: 14px 18px; color: #e2e8f0 !important; font-size: 13px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                    ${contentHtml}
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- TABELA DE DETALHES DO CHAMADO (Totalmente compatível com Outlook) -->
              ${ticketInfo ? `
              <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#07090e" style="background-color: #07090e !important; border: 1px solid #1f2533; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td bgcolor="#07090e" style="background-color: #07090e !important; padding: 8px 16px;">
                    <table width="100%" border="0" cellpadding="7" cellspacing="0">
                      <tr>
                        <td style="color: #8b949e !important; font-size: 13px; font-weight: 500; border-bottom: 1px solid #1a202c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Número do Chamado:
                        </td>
                        <td align="right" style="color: #45dfa4 !important; font-size: 14px; font-weight: 700; font-family: monospace; border-bottom: 1px solid #1a202c;">
                          ${ticketInfo.ticketNumber || '#000000'}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #8b949e !important; font-size: 13px; font-weight: 500; border-bottom: 1px solid #1a202c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Assunto / Título:
                        </td>
                        <td align="right" style="color: #ffffff !important; font-size: 13px; font-weight: 600; border-bottom: 1px solid #1a202c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          ${ticketInfo.title || ticketInfo.subject || 'Suporte'}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #8b949e !important; font-size: 13px; font-weight: 500; border-bottom: 1px solid #1a202c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Categoria:
                        </td>
                        <td align="right" style="color: #ffffff !important; font-size: 13px; font-weight: 600; border-bottom: 1px solid #1a202c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          ${ticketInfo.category || 'Geral'}${ticketInfo.subcategory ? ` &gt; ${ticketInfo.subcategory}` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #8b949e !important; font-size: 13px; font-weight: 500; border-bottom: 1px solid #1a202c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Prioridade:
                        </td>
                        <td align="right" style="color: #ffffff !important; font-size: 13px; font-weight: 600; border-bottom: 1px solid #1a202c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          ${ticketInfo.priority || 'Média'}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #8b949e !important; font-size: 13px; font-weight: 500; ${ticketInfo.assignedTo ? 'border-bottom: 1px solid #1a202c;' : ''} font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Solicitante:
                        </td>
                        <td align="right" style="color: #ffffff !important; font-size: 13px; font-weight: 600; ${ticketInfo.assignedTo ? 'border-bottom: 1px solid #1a202c;' : ''} font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          ${ticketInfo.requesterName || 'Cliente'}
                        </td>
                      </tr>
                      ${ticketInfo.assignedTo ? `
                      <tr>
                        <td style="color: #8b949e !important; font-size: 13px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                          Técnico Responsável:
                        </td>
                        <td align="right" style="color: #ffffff !important; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
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

          <!-- FOOTER -->
          <tr>
            <td align="center" bgcolor="#080a10" style="background-color: #080a10 !important; padding: 22px 24px; border-top: 1px solid #1c2230; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #8b949e !important; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                Este é um e-mail automático gerado pelo sistema <strong style="color: #ffffff !important;">GoDesc 360 Service Desk</strong>.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6e7681 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                Por favor, não responda diretamente a este e-mail.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #4b5563 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                &copy; ${currentYear} GoDesc 360. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

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
      <p style="margin: 0; font-weight: 700; color: #ffffff;">Autenticação Concluída com Sucesso!</p>
      <p style="margin: 8px 0 0 0; color: #c3c6d7;">O teste de autenticação SMTP com o servidor <strong style="color: #45dfa4;">${hostDisplay}</strong> foi concluído com êxito utilizando a conta <strong style="color: #ffffff;">${cfg.user}</strong>.</p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #8b949e;">A partir de agora, os seus clientes serão notificados por e-mail automaticamente a cada abertura, mudança de status e resposta nos chamados através do seu e-mail corporativo.</p>
    `
  });

  const mailAttachments = [];
  const logoAtt = getLogoAttachment();
  if (logoAtt) mailAttachments.push(logoAtt);

  const mailOptions = {
    from: `"${cfg.fromName || 'GoDesc 360 Service Desk'}" <${cfg.user}>`,
    to: recipient,
    subject: `🧪 [GoDesc 360] Teste de Conexão SMTP Realizado com Sucesso (${providerLabel})`,
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

  const mailAttachments = [];
  const logoAtt = getLogoAttachment();
  if (logoAtt) mailAttachments.push(logoAtt);

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
    from: `"${emailConfig.fromName || 'GoDesc 360 Service Desk'}" <${emailConfig.user}>`,
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
