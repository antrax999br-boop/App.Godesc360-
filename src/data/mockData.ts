import { Ticket, SystemNotification, KBArticle, ServiceStatus, ClientCompany, DomainItem } from '../types';

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tk-1',
    ticketNumber: '#000045',
    requesterName: 'Carlos Eduardo Ramos',
    requesterEmail: 'carlos.ramos@empresaabc.com.br',
    company: 'Empresa ABC',
    machineName: 'DESKTOP-Q2LCPBP',
    onlyMeOnComputer: true,
    category: 'Rede & Conectividade',
    subcategory: 'VPN Corporativa',
    priority: 'Alta',
    status: 'Novo',
    queue: 'N1',
    title: 'Falha de autenticação ao conectar na VPN de acesso remoto',
    description: 'Ao tentar conectar no cliente FortiClient/OpenVPN, aparece a mensagem "TLS handshake timeout". Já reiniciei o modem de casa e continua o erro.',
    createdAt: 'Hoje às 11:30',
    updatedAt: 'Hoje às 11:30',
    assignedTo: 'Equipe N1',
    attachments: [
      {
        name: 'erro_vpn_print.png',
        size: '1.2 MB',
        type: 'image/png',
        url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="%230d1117"/><rect x="20" y="20" width="760" height="360" rx="12" fill="%23161b22" stroke="%2330363d" stroke-width="2"/><text x="400" y="160" fill="%23ff7b72" font-family="monospace" font-size="20" font-weight="bold" text-anchor="middle">❌ ERRO: TLS Handshake Timeout (FortiClient VPN)</text><text x="400" y="210" fill="%23c9d1d9" font-family="sans-serif" font-size="14" text-anchor="middle">Falha de conexão com a rede remota vpn.godesc.net:443</text><text x="400" y="250" fill="%238b949e" font-family="monospace" font-size="12" text-anchor="middle">[Print de demonstração enviado pelo solicitante]</text></svg>'
      }
    ],
    messages: [
      {
        id: 'msg-1',
        sender: 'Carlos Eduardo Ramos',
        role: 'client',
        text: 'Chamado aberto pelo Portal do Cliente. Aguardo retorno urgente pois dependo do acesso ao ERP.',
        timestamp: '11:30'
      }
    ]
  },
  {
    id: 'tk-2',
    ticketNumber: '#000044',
    requesterName: 'Mariana Silveira',
    requesterEmail: 'mariana.silveira@construtoraglobal.com',
    company: 'Construtora Global',
    machineName: 'NOTE-FIN-08',
    onlyMeOnComputer: true,
    category: 'Software & Apps',
    subcategory: 'Office 365 / Outlook',
    priority: 'Média',
    status: 'Em Atendimento',
    title: 'Outlook travando ao enviar anexos em PDF pesados',
    description: 'O Outlook fecha sozinho ao tentar anexar arquivos maiores que 5MB para clientes externos. Ocorreu após a última atualização do Windows.',
    createdAt: 'Hoje às 10:15',
    updatedAt: 'Hoje às 10:45',
    assignedTo: 'Lucas TI',
    attachments: [],
    messages: [
      {
        id: 'msg-2',
        sender: 'Lucas TI',
        role: 'ti',
        text: 'Olá Mariana, estamos verificando o tamanho do cache do seu arquivo .PST. Faremos acesso remoto às 14h.',
        timestamp: '10:45'
      }
    ]
  },
  {
    id: 'tk-3',
    ticketNumber: '#000043',
    requesterName: 'Roberto Albuquerque',
    requesterEmail: 'roberto.alb@techlog.com.br',
    company: 'TechLog Brasil',
    machineName: 'SRV-STORAGE-01',
    onlyMeOnComputer: false,
    category: 'Acessos & Contas',
    subcategory: 'Reset de Senha / AD',
    priority: 'Crítica',
    status: 'Novo',
    title: 'Usuário administrador bloqueado após tentativas de login',
    description: 'Conta de serviço do sistema de faturamento foi bloqueada por tentativas excedidas. Precisa de desbloqueio imediato no Active Directory.',
    createdAt: 'Hoje às 09:50',
    updatedAt: 'Hoje às 09:50',
    assignedTo: 'Equipe N2',
    attachments: [],
    messages: []
  },
  {
    id: 'tk-4',
    ticketNumber: '#000042',
    requesterName: 'Fernanda Dias',
    requesterEmail: 'fernanda@inovar.com.br',
    company: 'Inovar Consultoria',
    machineName: 'DESK-MKT-03',
    onlyMeOnComputer: true,
    category: 'Hardware & Equipamentos',
    subcategory: 'Impressora Offline',
    priority: 'Baixa',
    status: 'Resolvido',
    title: 'Impressora HP do 2º andar não responde na rede',
    description: 'A impressora de rede estava com IP desconfigurado após manutenção de energia.',
    createdAt: 'Ontem às 16:20',
    updatedAt: 'Hoje às 08:30',
    assignedTo: 'Carlos TI',
    attachments: [],
    messages: [
      {
        id: 'msg-4',
        sender: 'Carlos TI',
        role: 'ti',
        text: 'IP fixado via DHCP e fila de impressão limpa. Impressora operacional.',
        timestamp: 'Ontem às 17:10'
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Novo Chamado',
    message: 'Empresa ABC abriu um ticket.',
    company: 'Empresa ABC',
    time: 'Há 10 min',
    timestamp: Date.now() - 600000,
    priority: 'Alta',
    read: true,
    ticketId: 'tk-1'
  },
  {
    id: 'notif-2',
    title: 'Chamado Crítico',
    message: 'TechLog Brasil reportou bloqueio de conta AD.',
    company: 'TechLog Brasil',
    time: 'Há 1 hora',
    timestamp: Date.now() - 3600000,
    priority: 'Crítica',
    read: true,
    ticketId: 'tk-3'
  },
  {
    id: 'notif-3',
    title: 'Alerta de Infraestrutura',
    message: 'Servidor de Hospedagem Node-02 apresentou lentidão no cPanel.',
    company: 'DescCloud Infra',
    time: 'Há 2 horas',
    timestamp: Date.now() - 7200000,
    priority: 'Alta',
    read: true
  }
];

export const INITIAL_SERVICES: ServiceStatus[] = [
  {
    id: 'srv-1',
    name: 'Servidores Principais',
    endpoint: 'cluster-prod.godesc.net',
    status: 'Operacional',
    uptime: '99.98%',
    latency: '12ms',
    description: 'Cluster Kubernetes e instâncias de aplicação principais operando normalmente.'
  },
  {
    id: 'srv-2',
    name: 'Sistema de Email',
    endpoint: 'mail.desccloud.com',
    status: 'Operacional',
    uptime: '99.95%',
    latency: '24ms',
    description: 'IMAP, POP3 e Webmail operando com fila limpa.'
  },
  {
    id: 'srv-3',
    name: 'Rede Interna VPN',
    endpoint: 'vpn.godesc.net',
    status: 'Instabilidade',
    uptime: '97.40%',
    latency: '148ms',
    lastIncident: 'Investigando oscilação na rota do gateway secundário em São Paulo.',
    description: 'Gateway secundário com perda ocasional de pacotes. Técnicos atuando no enlace.'
  },
  {
    id: 'srv-4',
    name: 'Servidor de Hospedagem',
    endpoint: 'host-srv-02.desccloud.com',
    status: 'Erro',
    uptime: '94.10%',
    latency: 'Time Out',
    lastIncident: 'Sobrecarga de I/O em partição SSD. Reinicialização de serviços em andamento.',
    description: 'Serviço HTTP Apache/Nginx reiniciando no node de hospedagem compartilhada.'
  },
  {
    id: 'srv-5',
    name: 'DNS / Cloudflare',
    endpoint: '1.1.1.1 / Anycast',
    status: 'Operacional',
    uptime: '100.00%',
    latency: '4ms',
    description: 'Resolução de nomes e proteção WAF sem anomalias.'
  },
  {
    id: 'srv-6',
    name: 'Anti-spam (Rspamd)',
    endpoint: 'filter.descmail.com',
    status: 'Operacional',
    uptime: '99.99%',
    latency: '18ms',
    description: 'Filtro Bayesiano e listas negras RBL ativas.'
  },
  {
    id: 'srv-7',
    name: 'Relay SendGrid (saída)',
    endpoint: 'smtp.sendgrid.net',
    status: 'Operacional',
    uptime: '99.99%',
    latency: '35ms',
    description: 'Entregabilidade de emails transacionais operando na taxa máxima.'
  }
];

export const INITIAL_KB_ARTICLES: KBArticle[] = [
  {
    id: 'kb-1',
    title: 'Como resetar a senha do seu e-mail ou computador',
    category: 'Acessos & Contas',
    summary: 'Passo a passo rápido para desbloquear sua conta ou redefinir senha expirada no portal corporativo.',
    readTime: '3 min',
    helpfulCount: 142,
    views: 1250,
    tags: ['senha', 'reset', 'login', 'acesso', 'desbloqueio'],
    content: [
      '1. Acesse o portal de autoatendimento em login.empresa.com.br ou pressione Ctrl + Alt + Del no seu Windows.',
      '2. Clique na opção "Esqueci minha senha" ou "Alterar Senha".',
      '3. Digite seu CPF/E-mail corporativo cadastrado para receber o código SMS de verificação.',
      '4. Crie uma nova senha respeitando os requisitos: Mínimo 8 caracteres, contendo 1 letra maiúscula, 1 número e 1 caractere especial (!@#$).',
      '5. Se sua conta estiver bloqueada por excesso de tentativas, aguarde 15 minutos ou abra um chamado na categoria "Acessos & Contas".'
    ]
  },
  {
    id: 'kb-2',
    title: 'Guia de Configuração e Conexão da VPN Corporativa',
    category: 'Rede & Conectividade',
    summary: 'Aprenda a instalar o cliente VPN no Windows/Mac e conectar-se à rede interna da empresa com segurança.',
    readTime: '5 min',
    helpfulCount: 98,
    views: 890,
    tags: ['vpn', 'rede', 'home office', 'acesso remoto', 'forticlient'],
    content: [
      '1. Baixe o instalador oficial do cliente VPN homologado através do portal GoDesc.',
      '2. Abra o aplicativo e insira o endereço do servidor: vpn.godesc.net na porta 443.',
      '3. Insira suas credenciais corporativas (mesmo usuário e senha do seu Windows/Email).',
      '4. Quando solicitado o Token 2FA (Duplo Fator), digite o código de 6 dígitos gerado no aplicativo do seu celular.',
      '5. Caso a conexão pare em 48% ou 98%, verifique se o seu antivírus não bloqueou o adaptador de rede virtual TAP.'
    ]
  },
  {
    id: 'kb-3',
    title: 'Como solucionar Impressora Offline ou Fila de Impressão Travada',
    category: 'Hardware & Equipamentos',
    summary: 'Dicas práticas para destravar documentos presos na fila de impressão e reconectar impressoras de rede.',
    readTime: '4 min',
    helpfulCount: 76,
    views: 640,
    tags: ['impressora', 'offline', 'spooler', 'hardware', 'papel'],
    content: [
      '1. Verifique se a impressora está ligada e o visor exibe o status "Pronto", sem alertas de papel ou toner.',
      '2. No Windows, pressione a tecla Windows + R, digite "services.msc" e tecle Enter.',
      '3. Localize o serviço "Spooler de Impressão", clique com o botão direito e selecione "Reiniciar".',
      '4. Acesse Configurações > Dispositivos e Impressoras, clique na sua impressora e desmarque a opção "Usar impressora offline".',
      '5. Faça uma página de teste. Se persistir, abra um ticket na categoria "Hardware & Equipamentos".'
    ]
  },
  {
    id: 'kb-4',
    title: 'Configurando o e-mail DescMail no Outlook e Celular',
    category: 'Software & Apps',
    summary: 'Parâmetros de configuração IMAP, POP e SMTP seguros para configurar seu e-mail corporativo.',
    readTime: '4 min',
    helpfulCount: 115,
    views: 1100,
    tags: ['email', 'descmail', 'outlook', 'imap', 'smtp', 'celular'],
    content: [
      '1. Servidor de Entrada (IMAP): mail.desccloud.com | Porta: 993 (SSL/TLS).',
      '2. Servidor de Saída (SMTP): mail.desccloud.com | Porta: 465 (SSL/TLS) ou 587 (STARTTLS).',
      '3. Nome de usuário: seu endereço de e-mail completo (ex: nome@empresa.com.br).',
      '4. Marque a caixa "Meu servidor de saída (SMTP) requer autenticação".',
      '5. Você também pode acessar diretamente via Webmail no navegador pelo link mail.desccloud.com.'
    ]
  },
  {
    id: 'kb-5',
    title: 'Otimização e Limpeza de Disco em Notebooks Lentos',
    category: 'Software & Apps',
    summary: 'Como liberar espaço em disco e acelerar o carregamento de softwares de trabalho.',
    readTime: '3 min',
    helpfulCount: 64,
    views: 420,
    tags: ['lentidao', 'disco', 'limpeza', 'software', 'desempenho'],
    content: [
      '1. Pressione Windows + R, digite %temp% e delete os arquivos temporários não utilizados.',
      '2. Execute o utilitário nativo "Limpeza de Disco" do Windows e selecione arquivos de sistema antigos.',
      '3. Feche abas desnecessárias no navegador Google Chrome ou Edge para liberar memória RAM.',
      '4. Reinicie o computador ao final de cada dia de trabalho para liberar caches travados.'
    ]
  }
];

export const INITIAL_CLIENTS: ClientCompany[] = [
  {
    id: 'cli-1',
    name: 'Empresa ABC Logística',
    contactName: 'Carlos Eduardo Ramos',
    email: 'ti@empresaabc.com.br',
    plan: 'Enterprise Cloud Pro',
    activeTickets: 3,
    mailboxes: 85,
    storageUsed: '640 GB',
    status: 'Ativo'
  },
  {
    id: 'cli-2',
    name: 'Construtora Global',
    contactName: 'Mariana Silveira',
    email: 'admin@construtoraglobal.com',
    plan: 'Dedicated Cloud 10TB',
    activeTickets: 2,
    mailboxes: 120,
    storageUsed: '1.2 TB',
    status: 'Ativo'
  },
  {
    id: 'cli-3',
    name: 'TechLog Brasil Solutions',
    contactName: 'Roberto Albuquerque',
    email: 'contato@techlog.com.br',
    plan: 'Business Ultra',
    activeTickets: 4,
    mailboxes: 95,
    storageUsed: '410 GB',
    status: 'Ativo'
  },
  {
    id: 'cli-4',
    name: 'Inovar Consultoria & Gestão',
    contactName: 'Fernanda Dias',
    email: 'suporte@inovar.com.br',
    plan: 'Standard Host',
    activeTickets: 0,
    mailboxes: 42,
    storageUsed: '180 GB',
    status: 'Ativo'
  },
  {
    id: 'cli-5',
    name: 'Clinica Médica MedCare',
    contactName: 'Dr. Paulo Siqueira',
    email: 'ti@medcare.com.br',
    plan: 'Health Safe Cloud',
    activeTickets: 1,
    mailboxes: 68,
    storageUsed: '320 GB',
    status: 'Ativo'
  }
];

export const INITIAL_DOMAINS: DomainItem[] = [
  {
    id: 'dom-1',
    domain: 'empresaabc.com.br',
    clientName: 'Empresa ABC Logística',
    dnsProvider: 'Cloudflare (Gerenciado)',
    mailboxesCount: 85,
    storage: '640 GB / 1 TB',
    status: 'OK',
    sslValid: true
  },
  {
    id: 'dom-2',
    domain: 'construtoraglobal.com',
    clientName: 'Construtora Global',
    dnsProvider: 'DescCloud DNS',
    mailboxesCount: 120,
    storage: '1.2 TB / 2 TB',
    status: 'OK',
    sslValid: true
  },
  {
    id: 'dom-3',
    domain: 'techlog.com.br',
    clientName: 'TechLog Brasil Solutions',
    dnsProvider: 'Cloudflare',
    mailboxesCount: 95,
    storage: '410 GB / 500 GB',
    status: 'Alerta',
    sslValid: true
  },
  {
    id: 'dom-4',
    domain: 'inovar.com.br',
    clientName: 'Inovar Consultoria & Gestão',
    dnsProvider: 'DescCloud DNS',
    mailboxesCount: 42,
    storage: '180 GB / 300 GB',
    status: 'OK',
    sslValid: true
  },
  {
    id: 'dom-5',
    domain: 'godesc.com.br',
    clientName: 'GoDesc Internal',
    dnsProvider: 'Cloudflare Enterprise',
    mailboxesCount: 142,
    storage: '820 GB / 2 TB',
    status: 'OK',
    sslValid: true
  }
];

export const APP_LOGO = '/logo-geral.png';
export const LOGO_URL = '/logo-geral.png';
export const LOGO_ALT_URL = '/logo-geral.png';

export const INITIAL_DATABASE_FOLDERS = [
  {
    id: 'fld-1',
    name: 'Senhas e Acessos Rápidos',
    color: '#45dfa4',
    createdAt: '01/08/2026',
    updatedAt: '05/08/2026'
  },
  {
    id: 'fld-2',
    name: 'Procedimentos de Suporte N1 & N2',
    color: '#38bdf8',
    createdAt: '02/08/2026',
    updatedAt: '05/08/2026'
  },
  {
    id: 'fld-3',
    name: 'Inventário & Fornecedores de TI',
    color: '#fbbf24',
    createdAt: '03/08/2026',
    updatedAt: '04/08/2026'
  }
];

export const INITIAL_DATABASE_NOTES = [
  {
    id: 'note-1',
    folderId: 'fld-1',
    title: 'Acesso Roteadores Mikrotik & Gateways de Filiais',
    content: `## Configurações e Portas de Acesso
- Gateway Matriz: 192.168.10.1 (Porta Winbox: 8291)
- Gateway Filial SP: 192.168.20.1
- Gateway Filial RJ: 192.168.30.1
- DNS Primário: 1.1.1.1 | Secundário: 8.8.8.8

## Procedimento de Reinicialização
1. Confirmar se não há transferências de backup em andamento.
2. Acessar via SSH com chave privada ou usuário admin local.
3. Executar comando: /system reboot.`,
    tags: ['Mikrotik', 'Redes', 'Gateways'],
    isPinned: true,
    author: 'Técnico t.i',
    createdAt: '01/08/2026 14:00',
    updatedAt: 'Hoje às 11:20'
  },
  {
    id: 'note-2',
    folderId: 'fld-2',
    title: 'Passo a Passo: Instalação e Padronização de Notebooks Novos',
    content: `### Checklist de Entrega de Máquina para Usuário
1. Instalar Windows 11 Pro e vincular ao Active Directory (dominio: godesc.local).
2. Instalar pacote Office 365 e ativar com email corporativo.
3. Instalar FortiClient VPN com certificado digital do usuário.
4. Configurar impressoras de rede padrões (2º e 3º andar).
5. Ativar BitLocker e salvar chave de recuperação no AD.
6. Instalar agente de antivírus corporativo e agente de inventário.`,
    tags: ['Checklist', 'Instalação', 'Windows 11'],
    isPinned: false,
    author: 'Analista Laércio',
    createdAt: '02/08/2026 09:30',
    updatedAt: 'Hoje às 10:15'
  },
  {
    id: 'note-3',
    folderId: 'fld-3',
    title: 'Contatos de Emergência - Operadoras de Fibra e Links',
    content: `## Links de Internet Dedicados
- **Vivo Fibra Corporativo**: 0800 700 5050 (Circuito: SP-VIV-992144)
- **Claro Embratel Dedicado**: 0800 721 2121 (Designação: 2026-FIB-881)
- **Suporte Firewall Fortinet**: suporte@godesc.com.br / (11) 3450-9900
- **Suporte Nobreak Sala de Servidores**: Engetron 24h: 0800 283 5000`,
    tags: ['Contatos', 'Operadoras', 'Emergência'],
    isPinned: false,
    author: 'Administrador TI',
    createdAt: '03/08/2026 16:45',
    updatedAt: '04/08/2026 18:00'
  }
];

export const INITIAL_CALENDAR_EVENTS = [
  {
    id: 'evt-1',
    title: 'Manutenção Preventiva nos Servidores de Aplicação',
    date: new Date().toISOString().split('T')[0], // Today's date automatically
    time: '14:30',
    location: 'Data Center Matriz - Av. Paulista, 1500 - Sala de Servidores 02',
    createdBy: 'Laércio TI',
    description: 'Verificação do array RAID dos discos, limpeza física e aplicação de patches de segurança no Proxmox/VMWare.',
    category: 'Manutenção' as const,
    priority: 'Alta' as const,
    notified: true,
    createdAt: '01/08/2026'
  },
  {
    id: 'evt-2',
    title: 'Instalação e Troca de Switches PoE no 4º Andar',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    time: '09:00',
    location: 'Filial Central - Rua Funchal, 418 - 4º Andar (Rack de Telecom)',
    createdBy: 'Carlos Eduardo Ramos',
    description: 'Substituição dos switches antigos de 100Mbps por novos Cisco Gigabit PoE para novos telefones IP.',
    category: 'Visita Técnica' as const,
    priority: 'Média' as const,
    notified: false,
    createdAt: '02/08/2026'
  },
  {
    id: 'evt-3',
    title: 'Reunião de Alinhamento de SLA e Novos Chamados com Diretoria',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    time: '16:00',
    location: 'Sala de Reuniões Executiva 01 / Google Meet',
    createdBy: 'Equipe de TI GoDesc',
    description: 'Apresentação dos indicadores de tempo de resposta, volume de tickets resolvidos e plano de expansão de infraestrutura.',
    category: 'Reunião' as const,
    priority: 'Média' as const,
    notified: false,
    createdAt: '03/08/2026'
  }
];
