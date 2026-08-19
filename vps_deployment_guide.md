# Safed Sheri 2026: VPS Deployment Guide

This guide will walk you through setting up your completely blank VPS and deploying the Safed Sheri Dockerized project into the `/vps/safedsheri` directory.

> [!IMPORTANT]
> Run these commands exactly as written in your SSH terminal (`root@200.97.161.91`).

---

## Step 1: Install Git & Basic Tools

First, we need to make sure your VPS is up to date and has Git installed so you can clone your repository.

If your VPS is **Ubuntu/Debian**, run:
```bash
apt update -y && apt upgrade -y
apt install git curl wget -y
```

If your VPS is **CentOS/AlmaLinux/Rocky** (which it looks like based on your hostname), run:
```bash
dnf update -y
dnf install git curl wget -y
```

---

## Step 2: Install Docker & Docker Compose

Since your project runs entirely on Docker, we need to install the Docker engine. Run these commands one by one:

**1. Install Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

**2. Start and Enable Docker (so it starts automatically if the server reboots):**
```bash
systemctl start docker
systemctl enable docker
```

**3. Install Docker Compose:**
```bash
curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

**4. Verify Installation:**
```bash
docker-compose --version
```
*(You should see an output showing the Docker Compose version)*

---

## Step 3: Create Directory & Clone the Repository

You mentioned you want the project located exactly at `/vps/safedsheri`. Let's create that folder structure and clone your GitHub repository.

**1. Create the `/vps` directory and enter it:**
```bash
mkdir -p /vps
cd /vps
```

**2. Clone your repository:**
```bash
git clone https://github.com/Kran19/safedsheri.git
```
*(Note: If your repository is **Private**, Git will ask for your GitHub username and password. For the password, you must use a GitHub Personal Access Token (PAT) rather than your actual account password).*

**3. Enter your project directory:**
```bash
cd /vps/safedsheri
```

---

## Step 4: Configure Environment Variables

Your project likely requires a `.env` file for database passwords, JWT secrets, and API keys. You must create this file on the VPS before starting the containers.

**1. Create/Edit the `.env` file:**
```bash
nano .env
```

**2. Paste your local `.env` variables into this file.**
*(Once you have pasted your variables, press `CTRL + X`, then `Y`, then `ENTER` to save and exit).*

> [!CAUTION]
> Make sure your `DATABASE_URL` in the `.env` file matches the Docker Postgres setup, and update any `localhost` URLs to your VPS IP address (`200.97.161.91`) or domain name!

---

## Step 5: Build and Start the Project

Now that the code and environment variables are ready, you can start the magic!

**1. Run Docker Compose to build and start everything:**
```bash
docker-compose up -d --build
```
*(This will take a few minutes as it downloads Node.js, Postgres, and builds your frontend and backend just like it does on your local computer).*

**2. Verify everything is running:**
```bash
docker ps
```
*(You should see your `safedsheri-admin`, `safedsheri-api`, and `safedsheri-postgres` containers listed as "Up").*

---

## Step 6: Setup the Database (First Time Only)

Because this is a brand new Postgres database inside the VPS, it is completely empty. You need to push your Prisma schema to create the tables.

**1. Run Prisma database push/migrate inside the API container:**
```bash
docker-compose exec api npx prisma db push
```
*(If you use migrations instead of db push, run `docker-compose exec api npx prisma migrate deploy` instead).*

---

## Step 7: Install & Configure Nginx (Reverse Proxy)

To access your website without typing `:3000` or `:4000` at the end of the URL, we need to set up Nginx to route normal web traffic to your Docker containers.

**1. Install Nginx:**
```bash
dnf install nginx -y
```

**2. Start and Enable Nginx:**
```bash
systemctl start nginx
systemctl enable nginx
```

**3. Create the Nginx Configuration File:**
```bash
nano /etc/nginx/conf.d/safedsheri.conf
```

**4. Paste the following configuration into the file:**
*(Make sure to change `yourdomain.com` if you have one, or just leave it as the IP address for now)*

```nginx
server {
    listen 80;
    server_name 200.97.161.91; # OR your actual domain like safedsheri.com

    # Route frontend requests to Admin Next.js Container
    location /safedsheri/ {
        proxy_pass http://localhost:3000/safedsheri/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Route API requests to NestJS Backend Container
    location /safedsheri/api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*(Press `CTRL + X`, then `Y`, then `ENTER` to save).*

**5. Test and Restart Nginx:**
```bash
nginx -t
systemctl restart nginx
```

---

## Step 8: You are Live! 🎉

Your project is now running on the VPS! 
You can now access your application directly via your IP address in the browser without typing any ports:

👉 **`http://200.97.161.91/safedsheri`**

> [!TIP]
> If you cannot access the website, you might need to open the HTTP port on the CentOS firewall:
> ```bash
> firewall-cmd --permanent --add-service=http
> firewall-cmd --permanent --add-service=https
> firewall-cmd --reload
> ```
