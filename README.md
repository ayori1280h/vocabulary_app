# 英単語学習アプリケーション

英単語の学習をサポートするためのインタラクティブなウェブアプリケーションです。単語の追加、意味や例文の自動取得、発音機能、学習進捗の管理などを行うことができます。

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

## システム構成図（PlantUML）

```plantuml
@startuml
!define RECTANGLE class

package "クライアント" {
  RECTANGLE Browser {
    + UI Components
    + React Hooks
  }
  RECTANGLE "Web Speech API" {
    + Text-to-Speech
  }
  Browser --> "Web Speech API" : 発音リクエスト
}

package "サーバー" {
  RECTANGLE "Next.js Server" {
    + API Routes
    + SSR
  }
  RECTANGLE "SQLite Database" {
    + words
    + definitions
    + examples
    + etymologies
    + related_words
  }
  "Next.js Server" --> "SQLite Database" : CRUD操作
}

package "外部サービス" {
  RECTANGLE "Gemini API" {
    + generateContent()
  }
}

Browser --> "Next.js Server" : HTTP Requests
"Next.js Server" --> "Gemini API" : API呼び出し

@enduml
```

## データベースER図（PlantUML）

```plantuml
@startuml
entity "words" {
  * id : integer <<PK>>
  --
  * word : text
  * phonetic : text
  * part_of_speech : text
  * status : text
  * created_at : datetime
  * updated_at : datetime
}

entity "definitions" {
  * id : integer <<PK>>
  --
  * word_id : integer <<FK>>
  * definition : text
  * part_of_speech : text
}

entity "examples" {
  * id : integer <<PK>>
  --
  * word_id : integer <<FK>>
  * example : text
  * translation : text
}

entity "etymologies" {
  * id : integer <<PK>>
  --
  * word_id : integer <<FK>>
  * etymology : text
}

entity "related_words" {
  * id : integer <<PK>>
  --
  * word_id : integer <<FK>>
  * related_word : text
  * relation_type : text
}

words ||--o{ definitions : "1対多"
words ||--o{ examples : "1対多"
words ||--o{ etymologies : "1対多"
words ||--o{ related_words : "1対多"

@enduml
```

## シーケンス図（PlantUML）

### 1. 単語情報の取得と表示

```plantuml
@startuml
actor ユーザー
participant ブラウザ
participant "Next.js Server" as Server
participant "SQLite DB" as DB
participant "Gemini API" as API

ユーザー -> ブラウザ : 単語カードをクリック
ブラウザ -> Server : 単語情報をリクエスト
Server -> DB : DBから単語情報取得
DB --> Server : 単語基本情報を返却
Server --> ブラウザ : 基本情報を表示

ユーザー -> ブラウザ : AIで単語情報を更新
ブラウザ -> Server : AI情報をリクエスト
Server -> API : AI情報をリクエスト
API --> Server : AI生成情報を返却
Server --> ブラウザ : AI情報を表示

ユーザー -> ブラウザ : 例文の発音をクリック
ブラウザ -> ブラウザ : Web Speech APIで発音
@enduml
```

### 2. 単語の追加プロセス

```plantuml
@startuml
actor ユーザー
participant ブラウザ
participant "Next.js Server" as Server
participant "SQLite DB" as DB

ユーザー -> ブラウザ : 単語追加ボタンをクリック
ブラウザ -> ブラウザ : 追加モーダルを表示
ユーザー -> ブラウザ : 単語情報を入力
ユーザー -> ブラウザ : 保存ボタンをクリック
ブラウザ -> Server : 単語保存をリクエスト
Server -> DB : DBに単語情報を保存
DB --> Server : 完了応答
Server --> ブラウザ : 保存完了表示
@enduml
```

### 3. 習得状態の変更プロセス

```plantuml
@startuml
actor ユーザー
participant ブラウザ
participant "Next.js Server" as Server
participant "SQLite DB" as DB

ユーザー -> ブラウザ : 単語カードをドラッグ
ユーザー -> ブラウザ : 別のエリアにドロップ
ブラウザ -> Server : 習得状態変更をリクエスト
Server -> DB : DBの状態を更新
DB --> Server : 完了応答
Server --> ブラウザ : 状態変更を表示
@enduml
```

## ユースケース図（PlantUML）

```plantuml
@startuml
left to right direction
actor "ユーザー" as user

rectangle "英単語学習アプリケーション" {
  usecase "単語の検索" as UC1
  usecase "新しい単語を追加" as UC2
  usecase "単語情報をAIで更新" as UC3
  usecase "発音を聞く" as UC4
  usecase "単語の習得状態を変更" as UC5
  usecase "単語カードを閲覧" as UC6
  usecase "単語の詳細を表示" as UC7
  usecase "例文の日本語訳を表示" as UC8
  
  UC2 .> UC3 : <<include>>
  UC7 .> UC4 : <<extend>>
  UC7 .> UC8 : <<include>>
  UC6 .> UC7 : <<extend>>
  UC5 .> UC6 : <<include>>
}

user --> UC1
user --> UC2
user --> UC3
user --> UC4
user --> UC5
user --> UC6

@enduml
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
npm install @google/generative-ai
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
