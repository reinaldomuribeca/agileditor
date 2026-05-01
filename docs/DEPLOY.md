# Deploy na VPS (Docker + Caddy)

## Pré-requisitos na VPS

```bash
# Ubuntu 22/24 LTS
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin git curl

# Iniciar Docker
systemctl enable --now docker
```

---

## 1. Clonar o repositório

```bash
cd /opt
git clone git@github.com:reinaldomuribeca/agileditor.git agil-editor
cd agil-editor
```

---

## 2. Criar o arquivo `.env`

```bash
cp .env.local.example .env
nano .env   # preencha todos os valores
```

Variáveis obrigatórias:

| Variável | Exemplo |
|---|---|
| `APP_PASSWORD` | uma senha forte |
| `SESSION_SECRET` | string aleatória longa (32+ chars) |
| `ANTHROPIC_API_KEY` | sk-ant-... |
| `OPENAI_API_KEY` | sk-... |
| `NEXT_PUBLIC_APP_URL` | https://editor.agiltime.com.br |
| `JOBS_DIR` | /data/jobs |

---

## 3. Configurar domínio no Caddyfile

```bash
# Troque editor.agiltime.com.br pelo seu domínio real
sed -i 's/editor.agiltime.com.br/meudominio.com/g' Caddyfile
```

Certifique-se de que:
- DNS A record do domínio aponta para o IP da VPS
- Portas 80 e 443 estão abertas no firewall

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

---

## 4. Build e subir

```bash
docker compose build
docker compose up -d
```

O Caddy vai obter o certificado TLS automaticamente na primeira requisição.

---

## 5. Verificar saúde

```bash
# Ver logs
docker compose logs -f app

# Health check
curl https://editor.agiltime.com.br/api/health
# Esperado: { "status": "ok", "version": "0.1.0", ... }
```

---

## 6. Cron de limpeza (rodar todo dia às 3h)

```bash
crontab -e
```

Adicionar:
```
0 3 * * * docker exec agil-editor /app/scripts/cleanup-old-jobs.sh >> /var/log/agil-cleanup.log 2>&1
```

---

## Atualizar o app

```bash
cd /opt/agil-editor
git pull
docker compose build app
docker compose up -d app
```

---

## Variáveis de ambiente opcionais

| Variável | Padrão | Descrição |
|---|---|---|
| `MAX_VIDEO_SIZE_MB` | 200 | Tamanho máximo do upload |
| `MAX_VIDEO_DURATION_SECONDS` | 600 | Duração máxima (10 min) |
| `GROQ_API_KEY` | — | API Groq para transcrição mais rápida |
| `PORT` | 3333 | Porta interna do Next.js |
