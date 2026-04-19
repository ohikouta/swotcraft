FROM node:latest

# 作業ディレクトリの作成
WORKDIR /app

# 依存関係ファイルを先にコピーしてインストール
COPY package*.json ./
RUN npm install
