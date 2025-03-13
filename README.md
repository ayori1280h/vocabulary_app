# 英単語学習アプリケーション

英単語の学習をサポートするためのインタラクティブなウェブアプリケーションです。単語の追加、意味や例文の自動取得、発音機能、学習進捗の管理などを行うことができます。
<p align="center">
  <img src="assets/screenshots/screenshot.webp" alt="App Demo" width="700">
</p>


## 主な機能

- **単語カード管理**: 単語と関連情報をカード形式で表示・管理
- **自動情報取得**: Gemini APIを使用して単語の意味、例文、語源を自動取得
- **ネイティブ発音**: 英語ネイティブの発音で単語や例文を聞くことができる機能
- **進捗管理**: ドラッグ＆ドロップで単語の学習状態を管理（未習得、学習中、習得済み）
- **例文の日本語訳表示**: 例文とその日本語訳を表示
- **システム構成**: SQLiteデータベースによる永続化

## 技術スタック

- **フロントエンド**: Next.js, React, TypeScript, Chakra UI
- **バックエンド**: Next.js API Routes
- **データベース**: SQLite
- **AI API**: Google Gemini API（単語情報の自動取得）
- **音声API**: Web Speech API（音声合成）

## システム構成図（Mermaid）

```mermaid
graph TB
    subgraph "クライアント"
        Browser["Browser\n+ UI Components\n+ React Hooks"]
    end
    
    subgraph "サーバー"
        NextServer["Next.js Server\n+ API Routes\n+ SSR"]
        SQLite["SQLite Database\n+ words\n+ definitions\n+ examples\n+ etymologies\n+ related_words"]
        WebSpeechController["Web Speech Controller\n+ Text-to-Speech処理\n+ 音声データ生成・配信"]
        GeminiController["Gemini API Controller\n+ 単語情報取得\n+ レスポンス整形"]
        
        NextServer --> SQLite
        NextServer --> WebSpeechController
        NextServer --> GeminiController
    end
    
    subgraph "外部サービス"
        GeminiAPI["Gemini API\n+ generateContent()"]
        WebSpeechAPI["Web Speech API\n+ SpeechSynthesis"]
    end
    
    Browser --> NextServer
    GeminiController --> GeminiAPI
    WebSpeechController --> WebSpeechAPI
    
    note["すべての外部API通信は\nサーバー経由で行われる"]
    Browser --- note
```

## データベースER図（Mermaid）

```mermaid
erDiagram
    words ||--o{ definitions : "1対多"
    words ||--o{ examples : "1対多"
    words ||--o{ etymologies : "1対多"
    words ||--o{ related_words : "1対多"
    
    words {
        integer id PK
        text word
        text phonetic
        text part_of_speech
        text status
        datetime created_at
        datetime updated_at
    }
    
    definitions {
        integer id PK
        integer word_id FK
        text definition
        text part_of_speech
    }
    
    examples {
        integer id PK
        integer word_id FK
        text example
        text translation
    }
    
    etymologies {
        integer id PK
        integer word_id FK
        text etymology
    }
    
    related_words {
        integer id PK
        integer word_id FK
        text related_word
        text relation_type
    }
```

## シーケンス図（Mermaid）

### 1. 単語情報の取得と表示

```mermaid
sequenceDiagram
    actor ユーザー
    participant Browser as ブラウザ
    participant Server as Next.js Server
    participant DB as SQLite DB
    participant APIController as Gemini API Controller
    participant API as Gemini API
    participant SpeechController as Web Speech Controller
    participant SpeechAPI as Web Speech API
    
    ユーザー->>Browser: 単語カードをクリック
    Browser->>Server: 単語情報をリクエスト
    Server->>DB: DBから単語情報取得
    DB-->>Server: 単語基本情報を返却
    Server-->>Browser: 基本情報を表示
    
    ユーザー->>Browser: AIで単語情報を更新
    Browser->>Server: AI情報をリクエスト
    Server->>APIController: 単語情報取得を依頼
    APIController->>API: AI情報をリクエスト
    API-->>APIController: AI生成情報を返却
    APIController-->>Server: 整形された単語情報
    Server->>DB: 新しい情報を保存
    Server-->>Browser: AI情報を表示
    
    ユーザー->>Browser: 例文の発音をクリック
    Browser->>Server: 発音リクエスト
    Server->>SpeechController: 音声合成リクエスト
    SpeechController->>SpeechAPI: 音声データ生成
    SpeechAPI-->>SpeechController: 音声データ
    SpeechController-->>Server: 処理済み音声データ
    Server-->>Browser: 音声データ
    Browser->>Browser: 音声を再生
```

### 2. 単語の追加プロセス

```mermaid
sequenceDiagram
    actor ユーザー
    participant ブラウザ
    participant Server as Next.js Server
    participant DB as SQLite DB
    
    ユーザー->>ブラウザ: 単語追加ボタンをクリック
    ブラウザ->>ブラウザ: 追加モーダルを表示
    ユーザー->>ブラウザ: 単語情報を入力
    ユーザー->>ブラウザ: 保存ボタンをクリック
    ブラウザ->>Server: 単語保存をリクエスト
    Server->>DB: DBに単語情報を保存
    DB-->>Server: 完了応答
    Server-->>ブラウザ: 保存完了表示
```

### 3. 習得状態の変更プロセス

```mermaid
sequenceDiagram
    actor ユーザー
    participant ブラウザ
    participant Server as Next.js Server
    participant DB as SQLite DB
    
    ユーザー->>ブラウザ: 単語カードをドラッグ
    ユーザー->>ブラウザ: 別のエリアにドロップ
    ブラウザ->>Server: 習得状態変更をリクエスト
    Server->>DB: DBの状態を更新
    DB-->>Server: 完了応答
    Server-->>ブラウザ: 状態変更を表示
```

## ユースケース図（Mermaid）

```mermaid
graph LR
    user((ユーザー))
    
    subgraph "英単語学習アプリケーション"
        UC1[単語の検索]
        UC2[新しい単語を追加]
        UC3[単語情報をAIで更新]
        UC4[発音を聞く]
        UC5[単語の習得状態を変更]
        UC6[単語カードを閲覧]
        UC7[単語の詳細を表示]
        UC8[例文の日本語訳を表示]
        
        UC2 -.-> UC3
        UC7 -.-> UC4
        UC7 -.-> UC8
        UC6 -.-> UC7
        UC5 -.-> UC6
    end
    
    user --> UC1
    user --> UC2
    user --> UC3
    user --> UC4
    user --> UC5
    user --> UC6
```

## インストール方法

### 前提条件

- Node.js 18.x以上
- npm 9.x以上

### インストール手順

1. リポジトリをクローンする
```bash
git clone https://github.com/yourusername/vocabulary-app.git
cd vocabulary-app
```

2. 依存パッケージをインストールする
```bash
npm install
```

3. 環境変数の設定
```bash
# .env.local ファイルを作成
NEXT_PUBLIC_GEMINI_API_KEY=あなたのGemini APIキー
```

4. データベースの初期化
```bash
node server/database.js
```

5. アプリケーションの起動
```bash
npm run dev
```

## 使用方法

- **単語の追加**: 「+」ボタンをクリックしてモーダルを開き、単語情報を入力して保存します。
- **単語のブラウズ**: 未習得、習得中、習得済みの各エリアで単語カードを確認できます。
- **単語の発音**: 単語カードや例文の横にある音声アイコンをクリックすると発音が再生されます。
- **AI情報の取得**: 単語詳細画面で「AIで単語情報を更新」ボタンをクリックすると、Gemini APIから最新の情報を取得できます。
- **習得状態の変更**: 単語カードをドラッグして別のエリアにドロップすると、習得状態が変更されます。

## ライセンス

MIT
