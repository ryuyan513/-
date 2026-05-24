# 🌍 世界エネルギー監視ダッシュボード
## World Energy Intelligence Monitor

石油・天然ガス・LNG投資向けリアルタイム地政学リスク監視ダッシュボード。

### 機能 / Features

| 機能 | 説明 |
|------|------|
| **エネルギー価格パネル** | WTI原油 / ブレント原油 / ヘンリーハブ天然ガス / 米国ガソリン / 米原油在庫 |
| **地政学シグナル** | ホルムズ海峡 / OPEC+ / サウジアラビア / UAE / 米シェール / イラン / LNG |
| **石油・ガスニュース** | GDELTから過去24時間の関連記事を自動収集・分類 |
| **世界情勢フィード** | 紛争・制裁・外交ニュースを過去12時間分表示 |

---

### データソース / Data Sources

- **[EIA Open Data API](https://www.eia.gov/opendata/)** — 米国エネルギー情報局（価格・在庫）  
- **[GDELT Project DOC 2.0](https://gdeltproject.org/)** — グローバルニュース集約（無料・キー不要）

---

### セットアップ / Quick Start

#### 1. EIA APIキー取得（推奨）

1. [https://www.eia.gov/opendata/](https://www.eia.gov/opendata/) にアクセス
2. 無料アカウント登録（メールのみ）
3. `.env` ファイルを作成:

```bash
cp .env.example .env
# EIA_API_KEY=あなたのキー を編集
```

> `DEMO_KEY` でも動作しますが、レート制限があります（1日100req / 1時間10req）。

#### 2. Docker Compose で起動（推奨）

```bash
docker-compose up --build
```

ブラウザで `http://localhost:3000` を開く。

#### 3. ローカル開発

**バックエンド:**
```bash
cd backend
pip install -r requirements.txt
EIA_API_KEY=your_key uvicorn main:app --reload
```

**フロントエンド:**
```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` を開く（バックエンドへの `/api/*` は自動プロキシ）。

---

### アーキテクチャ / Architecture

```
frontend (React + Vite + Tailwind)
    └─ /api/* → backend (FastAPI)
                    ├─ /api/energy-prices → EIA API (WTI/Brent/Gas/Gasoline)
                    ├─ /api/inventory     → EIA API (週次原油在庫)
                    ├─ /api/energy-news   → GDELT DOC 2.0 API
                    └─ /api/global-news   → GDELT DOC 2.0 API
```

キャッシュ: 価格30分 / 在庫60分 / ニュース5分（EIA APIレート制限対策）

---

### 監視対象キーワード / Monitored Keywords

**シグナル別:**
- 🚢 **ホルムズ海峡**: Hormuz, Strait, Persian Gulf, tanker attack
- 🛢️ **OPEC/OPEC+**: OPEC, production cut, oil output, barrel quota
- 🇸🇦 **サウジアラビア**: Saudi Arabia, Aramco, Riyadh
- 🇦🇪 **UAE**: UAE, Abu Dhabi, ADNOC
- ⛏️ **米シェール**: shale, Permian Basin, fracking, tight oil
- ⚠️ **イラン/制裁**: Iran, IRGC, Khamenei, oil sanction
- 🔵 **LNG**: LNG, liquefied natural gas, LNG terminal

---

### 参考オープンソース / Inspired By

- [koala73/worldmonitor](https://github.com/koala73/worldmonitor) — Real-time global intelligence dashboard (41k ★)
- [SageHourihan/clermont](https://github.com/SageHourihan/clermont) — Open source world situation monitor
- [ashioyajotham/global-activity-monitor](https://github.com/ashioyajotham/global-activity-monitor) — GDELT-based geopolitical tracker
