const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// データベースファイルのパス
const dbPath = path.join(__dirname, 'vocabulary.db');
const dbExists = fs.existsSync(dbPath);

// データベース接続
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('データベース接続エラー:', err.message);
    return;
  }
  console.log('SQLiteデータベースに接続しました');
});

// テーブル作成関数（初期化時のみ実行）
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    // トランザクションを開始
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');  // 外部キー制約を有効にする

      // WORDS テーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word TEXT NOT NULL UNIQUE,
          phonetic TEXT,
          part_of_speech TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_reviewed_at DATETIME,
          status TEXT DEFAULT 'unknown',
          review_count INTEGER DEFAULT 0
        )
      `);

      // DEFINITIONS テーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS definitions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word_id INTEGER NOT NULL,
          definition TEXT NOT NULL,
          part_of_speech TEXT,
          FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
        )
      `);

      // EXAMPLES テーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS examples (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word_id INTEGER NOT NULL,
          example TEXT NOT NULL,
          translation TEXT,
          FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
        )
      `);

      // ETYMOLOGIES テーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS etymologies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word_id INTEGER NOT NULL,
          etymology TEXT NOT NULL,
          FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
        )
      `);

      // RELATED_WORDS テーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS related_words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word_id INTEGER NOT NULL,
          related_word TEXT NOT NULL,
          relationship_type TEXT,
          FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

// データベースが存在しない場合は初期化
if (!dbExists) {
  initializeDatabase()
    .then(() => {
      console.log('データベーススキーマが初期化されました');
      // 初期化完了後、明示的にプロセスを終了
      if (require.main === module) {
        // このファイルが直接実行された場合のみプロセスを終了
        setTimeout(() => {
          db.close((err) => {
            if (err) {
              console.error('データベースクローズエラー:', err.message);
              process.exit(1);
            } else {
              console.log('データベース接続を閉じました');
              process.exit(0);
            }
          });
        }, 100); // 少し待ってからクローズ
      }
    })
    .catch(err => {
      console.error('データベーススキーマの初期化エラー:', err);
      process.exit(1);
    });
} else {
  console.log('既存のデータベースを使用します');
  // 既存DBを使用する場合も、直接実行時はプロセスを終了
  if (require.main === module) {
    setTimeout(() => {
      db.close((err) => {
        if (err) {
          console.error('データベースクローズエラー:', err.message);
          process.exit(1);
        } else {
          console.log('データベース接続を閉じました');
          process.exit(0);
        }
      });
    }, 100); // 少し待ってからクローズ
  }
}

// プロセス終了時にデータベース接続をクローズ
process.on('exit', () => {
  db.close((err) => {
    if (err) {
      console.error('データベースクローズエラー:', err.message);
    } else {
      console.log('データベース接続を閉じました');
    }
  });
});

module.exports = { db, initializeDatabase }; 