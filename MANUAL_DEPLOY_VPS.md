# 🚀 Manual Completo de Deploy em VPS - GoDesc 360 Service Desk

Este manual fornece o passo a passo oficial, testado e validado, para hospedar o **GoDesc 360** em uma **VPS Linux (Ubuntu 22.04 / 24.04 LTS ou Debian 12)** com **100% de estabilidade e funcionamento** de todas as tecnologias:

1. **Frontend Web**: React 19 + Tailwind CSS v4 + Vite SPA servido pelo **Nginx**.
2. **Backend Microserviço**: Node.js 20 LTS + **Baileys WhatsApp Multi-Device** (com suporte a mídias, áudios, fotos, chatbot de filas e reconexão automática) + **Disparos de E-mail SMTP**, gerenciado pelo **PM2**.
3. **Banco de Dados Relacional & Tempo Real**: **Supabase / PostgreSQL Realtime** com as 10 tabelas completas.
4. **Certificado de Segurança**: **SSL HTTPS Gratuito** com renovação automática via **Let's Encrypt / Certbot**.

---

## 📋 1. Requisitos da VPS e Firewall

### Especificações Mínimas da VPS:
- **CPU:** 2 vCPUs
- **Memória RAM:** 2 GB no mínimo (4 GB recomendado)
- **Armazenamento:** 20 GB a 25 GB SSD/NVMe
- **Sistema Operacional:** Ubuntu 22.04 LTS ou Ubuntu 24.04 LTS (64-bit)

### Portas do Firewall (UFW):
| Porta | Protocolo | Serviço / Finalidade | Regra UFW |
| :--- | :---: | :--- | :--- |
| **22** | TCP | Acesso Administrativo SSH | `sudo ufw allow 22/tcp` |
| **80** | TCP | HTTP Web e validação SSL Let's Encrypt | `sudo ufw allow 80/tcp` |
| **443** | TCP | HTTPS Seguro para a aplicação web | `sudo ufw allow 443/tcp` |
| **10000** | TCP | API do Microservidor WhatsApp & E-mails | `sudo ufw allow 10000/tcp` |
| **587 / 465** | TCP | Conexão externa SMTP (Saída) | Liberado por padrão |

---

## 🛠️ 2. Preparação do Servidor VPS

Acesse sua VPS via terminal SSH:
```bash
ssh root@SEU_IP_DA_VPS
```

Execute os comandos de atualização e instalação das dependências essenciais:

```bash
# 1. Atualizar pacotes do Linux
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw software-properties-common

# 2. Configurar o Firewall (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 10000/tcp
sudo ufw enable
# Pressione 'y' e Enter

# 3. Instalar Node.js 20 LTS e PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 4. Instalar Nginx e Certbot
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 🗄️ 3. Banco de Dados: Supabase PostgreSQL Realtime

O sistema utiliza o PostgreSQL com suporte a WebSockets/Realtime do Supabase.

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. No menu lateral, clique em **SQL Editor** > **+ New Query**.
3. Abra o arquivo `database_schema_completo.sql` presente na raiz deste repositório, copie todo o código e cole no editor.
4. Clique em **RUN** para criar as 10 tabelas (`tickets`, `notifications`, `managed_users`, `calendar_events`, `vault_credentials`, `db_folders`, `db_notes`, `ticket_categories`, `companies`, `expenses`) e habilitar a replicação Realtime.
5. Acesse **Project Settings > API** e copie:
   - **Project URL:** Ex: `https://xxxx.supabase.co`
   - **anon / public key:** Chave JWT pública.

---

## 📂 4. Baixar o Projeto na VPS

```bash
# Navegar até o diretório padrão de sites
cd /var/www

# Clonar o repositório
sudo git clone https://github.com/antrax999br-boop/App.Godesc360-.git godesc-service-desk

# Conceder permissões para o seu usuário
sudo chown -R $USER:$USER /var/www/godesc-service-desk
cd /var/www/godesc-service-desk
```

Crie o arquivo de variáveis de ambiente:
```bash
nano /var/www/godesc-service-desk/.env
```

Preencha com suas credenciais:
```env
VITE_SUPABASE_URL="https://SEU_PROJETO.supabase.co"
VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_DO_SUPABASE"
VITE_API_URL="https://seudominio.com.br/api"
```
*(Salve com `Ctrl + O` e saia com `Ctrl + X`)*.

---

## 🤖 5. Configuração do Backend (WhatsApp Baileys & SMTP)

```bash
cd /var/www/godesc-service-desk/server
npm install

# Garantir a pasta de persistência do WhatsApp para não perder a sessão
mkdir -p /var/www/godesc-service-desk/server/baileys_auth_info
chmod -R 775 /var/www/godesc-service-desk/server/baileys_auth_info

# Iniciar o microservidor via PM2
pm2 start index.js --name "godesc-api"
pm2 save
pm2 startup
```
> **Nota do `pm2 startup`:** Copie e execute o comando indicado pelo terminal (ex: `sudo env PATH=... pm2 startup systemd -u ...`) para garantir a inicialização automática no boot da VPS.

Verifique se o backend está online:
```bash
pm2 status
pm2 logs godesc-api --lines 20
```

---

## ⚡ 6. Compilação do Frontend Web (Build)

```bash
cd /var/www/godesc-service-desk
npm install
npm run build
```
Isso gerará os arquivos estáticos de produção na pasta `/var/www/godesc-service-desk/dist`.

---

## 🌐 7. Configuração do Nginx (Virtual Host + Proxy Reverso)

Crie o arquivo de configuração do site:
```bash
sudo nano /etc/nginx/sites-available/godesc
```

Cole a configuração abaixo (ajuste `seudominio.com.br` para o seu domínio real):

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    # Limite aumentado para upload de imagens, prints e anexos
    client_max_body_size 50M;

    root /var/www/godesc-service-desk/dist;
    index index.html;

    # Suporte a SPA (Single Page Application - React)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy Reverso para a API e WhatsApp (Porta 10000)
    location /api/ {
        proxy_pass http://127.0.0.1:10000/;
        proxy_http_version 1.1;

        # Suporte completo a WebSockets e Long-Polling
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Cabeçalhos de encaminhamento de IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts para mídias grandes
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }

    # Cache de arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Ative o site e reinicie o Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/godesc /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 8. Apontamento de Domínio e Certificado SSL Gratuito (HTTPS)

1. No seu gerenciador de DNS (Registro.br, Cloudflare, Hostinger):
   - Crie uma entrada **A** apontando `@` para o **IP da sua VPS**.
   - Crie uma entrada **CNAME** apontando `www` para `seudominio.com.br`.
   *(Se usar Cloudflare, deixe a nuvem em cinza / DNS Only no momento da emissão)*.

2. Emita o certificado com o Certbot:
```bash
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```
Selecione para redirecionar todo o tráfego HTTP para HTTPS. O Certbot configurará a renovação automática no `systemd`.

---

## 🔄 9. Script de Atualização Rápida (Deploy Contínuo)

Para atualizar o sistema com novos recursos enviados ao GitHub sem precisar digitar vários comandos manuais:

```bash
nano /var/www/godesc-service-desk/atualizar.sh
```

Cole o conteúdo:
```bash
#!/bin/bash
echo "=== INICIANDO ATUALIZAÇÃO DO GODESC 360 ==="
cd /var/www/godesc-service-desk

# 1. Puxar alterações do repositório
git pull origin main

# 2. Atualizar backend e reiniciar processo
cd /var/www/godesc-service-desk/server
npm install
pm2 restart godesc-api

# 3. Atualizar frontend e recompilar
cd /var/www/godesc-service-desk
npm install
npm run build

# 4. Recarregar o Nginx
sudo systemctl reload nginx

echo "=== ATUALIZAÇÃO FINALIZADA COM SUCESSO! ==="
pm2 status
```

Torne executável:
```bash
chmod +x /var/www/godesc-service-desk/atualizar.sh
```

Sempre que precisar atualizar o sistema, basta rodar:
```bash
/var/www/godesc-service-desk/atualizar.sh
```

---

## ✅ 10. Checklist de Validação Final

- [x] **Acesso HTTPS Seguro:** Acesse `https://seudominio.com.br` e valide o cadeado SSL ativo.
- [x] **Login Inicial:** Acesse com o usuário configurado na tabela `managed_users`.
- [x] **Conexão WhatsApp 24/7:** Acesse o menu de WhatsApp, clique em Conectar e escaneie o QR Code no seu smartphone. Teste o envio de uma mensagem e verifique o menu de filas respondendo automaticamente.
- [x] **Mídias do WhatsApp:** Envie uma foto ou print pelo WhatsApp e verifique se aparece em tempo real no chat do chamado.
- [x] **Disparos SMTP:** Acesse Configurações > E-mail, informe suas credenciais SMTP e clique em "Testar Conexão".
- [x] **Módulo Financeiro:** Lance despesas e teste o botão unificado de status mensal ("Pendente", "Aprovado", "Pago").
- [x] **Reinicialização da VPS:** Execute `sudo reboot` na VPS e confirme que o Nginx, o PM2 e o WhatsApp sobem sozinhos sem intervenção manual.
