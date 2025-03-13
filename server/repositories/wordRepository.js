const { db } = require('../database');

class WordRepository {
  /**
   * 新しい単語を追加する
   * @param {Object} wordData - 単語データ
   * @returns {Promise<number>} - 追加された単語のID
   */
  createWord(wordData) {
    return new Promise((resolve, reject) => {
      const { word, phonetic, part_of_speech, status = 'unknown' } = wordData;
      
      // トランザクションを開始
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) return reject(err);
        
        // 単語を追加
        db.run(
          `INSERT INTO words (word, phonetic, part_of_speech, status, created_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [word, phonetic, part_of_speech, status],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            const wordId = this.lastID;
            
            // 定義の追加処理
            const addDefinitions = () => {
              if (!wordData.definitions || wordData.definitions.length === 0) {
                return Promise.resolve();
              }
              
              const promises = wordData.definitions.map(def => {
                return new Promise((resolveDefinition, rejectDefinition) => {
                  db.run(
                    `INSERT INTO definitions (word_id, definition, part_of_speech)
                     VALUES (?, ?, ?)`,
                    [wordId, def.definition, def.part_of_speech],
                    (err) => {
                      if (err) rejectDefinition(err);
                      else resolveDefinition();
                    }
                  );
                });
              });
              
              return Promise.all(promises);
            };
            
            // 例文の追加処理
            const addExamples = () => {
              if (!wordData.examples || wordData.examples.length === 0) {
                return Promise.resolve();
              }
              
              const promises = wordData.examples.map(ex => {
                return new Promise((resolveExample, rejectExample) => {
                  db.run(
                    `INSERT INTO examples (word_id, example, translation)
                     VALUES (?, ?, ?)`,
                    [wordId, ex.example, ex.translation],
                    (err) => {
                      if (err) rejectExample(err);
                      else resolveExample();
                    }
                  );
                });
              });
              
              return Promise.all(promises);
            };
            
            // 語源の追加処理
            const addEtymologies = () => {
              if (!wordData.etymologies || wordData.etymologies.length === 0) {
                return Promise.resolve();
              }
              
              const promises = wordData.etymologies.map(ety => {
                return new Promise((resolveEtymology, rejectEtymology) => {
                  db.run(
                    `INSERT INTO etymologies (word_id, etymology)
                     VALUES (?, ?)`,
                    [wordId, ety.etymology],
                    (err) => {
                      if (err) rejectEtymology(err);
                      else resolveEtymology();
                    }
                  );
                });
              });
              
              return Promise.all(promises);
            };
            
            // 関連語の追加処理
            const addRelatedWords = () => {
              if (!wordData.related_words || wordData.related_words.length === 0) {
                return Promise.resolve();
              }
              
              const promises = wordData.related_words.map(rel => {
                return new Promise((resolveRelated, rejectRelated) => {
                  db.run(
                    `INSERT INTO related_words (word_id, related_word, relationship_type)
                     VALUES (?, ?, ?)`,
                    [wordId, rel.related_word, rel.relationship_type],
                    (err) => {
                      if (err) rejectRelated(err);
                      else resolveRelated();
                    }
                  );
                });
              });
              
              return Promise.all(promises);
            };
            
            // すべての関連データを追加
            Promise.all([
              addDefinitions(),
              addExamples(),
              addEtymologies(),
              addRelatedWords()
            ])
              .then(() => {
                db.run('COMMIT', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                  } else {
                    resolve(wordId);
                  }
                });
              })
              .catch(err => {
                db.run('ROLLBACK');
                reject(err);
              });
          }
        );
      });
    });
  }

  /**
   * すべての単語を取得する
   * @returns {Promise<Array>} - 単語のリスト
   */
  getAllWords() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM words ORDER BY word ASC`, (err, words) => {
        if (err) return reject(err);
        resolve(words);
      });
    });
  }

  /**
   * 単語の詳細情報を取得する（関連データも含む）
   * @param {number} wordId - 単語のID
   * @returns {Promise<Object>} - 詳細な単語情報
   */
  getWordDetails(wordId) {
    return new Promise((resolve, reject) => {
      // まず単語の基本情報を取得
      db.get(`SELECT * FROM words WHERE id = ?`, [wordId], (err, word) => {
        if (err) return reject(err);
        if (!word) return resolve(null); // 単語が見つからない場合
        
        // 定義を取得
        db.all(`SELECT * FROM definitions WHERE word_id = ?`, [wordId], (err, definitions) => {
          if (err) return reject(err);
          word.definitions = definitions || [];
          
          // 例文を取得
          db.all(`SELECT * FROM examples WHERE word_id = ?`, [wordId], (err, examples) => {
            if (err) return reject(err);
            word.examples = examples || [];
            
            // 語源を取得
            db.all(`SELECT * FROM etymologies WHERE word_id = ?`, [wordId], (err, etymologies) => {
              if (err) return reject(err);
              word.etymologies = etymologies || [];
              
              // 関連語を取得
              db.all(`SELECT * FROM related_words WHERE word_id = ?`, [wordId], (err, relatedWords) => {
                if (err) return reject(err);
                word.related_words = relatedWords || [];
                
                resolve(word);
              });
            });
          });
        });
      });
    });
  }

  /**
   * 単語を検索する
   * @param {string} searchTerm - 検索キーワード
   * @returns {Promise<Array>} - マッチする単語のリスト
   */
  searchWords(searchTerm) {
    return new Promise((resolve, reject) => {
      const searchPattern = `%${searchTerm}%`;
      db.all(
        `SELECT * FROM words WHERE word LIKE ? ORDER BY word ASC`,
        [searchPattern],
        (err, words) => {
          if (err) return reject(err);
          resolve(words);
        }
      );
    });
  }

  /**
   * 単語の状態を更新する
   * @param {number} wordId - 単語のID
   * @param {string} status - 新しい状態（unknown, learning, mastered）
   * @returns {Promise<void>}
   */
  updateWordStatus(wordId, status) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE words 
         SET status = ?,
             last_reviewed_at = CURRENT_TIMESTAMP,
             review_count = review_count + 1
         WHERE id = ?`,
        [status, wordId],
        function(err) {
          if (err) return reject(err);
          if (this.changes === 0) return reject(new Error('単語が見つかりません'));
          resolve();
        }
      );
    });
  }

  /**
   * 単語を削除する
   * @param {number} wordId - 単語のID
   * @returns {Promise<void>}
   */
  deleteWord(wordId) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM words WHERE id = ?`, [wordId], function(err) {
        if (err) return reject(err);
        if (this.changes === 0) return reject(new Error('単語が見つかりません'));
        resolve();
      });
    });
  }

  /**
   * スタス別に単語を取得する
   * @param {string} status - 単語の状態 (unknown, learning, mastered)
   * @returns {Promise<Array>} - 単語のリスト
   */
  getWordsByStatus(status) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM words WHERE status = ? ORDER BY word ASC`,
        [status],
        (err, words) => {
          if (err) return reject(err);
          resolve(words);
        }
      );
    });
  }

  /**
   * 単語の詳細情報を更新する
   * @param {number} wordId - 単語のID
   * @param {Object} wordData - 更新する単語データ
   * @returns {Promise<void>}
   */
  updateWordDetails(wordId, wordData) {
    return new Promise((resolve, reject) => {
      // トランザクションを開始
      db.run('BEGIN TRANSACTION', async (err) => {
        if (err) return reject(err);
        
        try {
          // 単語の基本情報を更新
          await new Promise((resolveUpdate, rejectUpdate) => {
            db.run(
              `UPDATE words 
               SET phonetic = ?,
                   part_of_speech = ?,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [wordData.phonetic || '', wordData.part_of_speech || '', wordId],
              function(err) {
                if (err) return rejectUpdate(err);
                if (this.changes === 0) return rejectUpdate(new Error('単語が見つかりません'));
                resolveUpdate();
              }
            );
          });
          
          // 定義を更新（既存のものを削除して新しく追加）
          if (wordData.definitions) {
            // 既存の定義を削除
            await new Promise((resolveDelete, rejectDelete) => {
              db.run(`DELETE FROM definitions WHERE word_id = ?`, [wordId], (err) => {
                if (err) return rejectDelete(err);
                resolveDelete();
              });
            });
            
            // 新しい定義を追加
            if (wordData.definitions.length > 0) {
              for (const def of wordData.definitions) {
                await new Promise((resolveInsert, rejectInsert) => {
                  db.run(
                    `INSERT INTO definitions (word_id, definition, part_of_speech)
                     VALUES (?, ?, ?)`,
                    [wordId, def.definition, def.part_of_speech || ''],
                    (err) => {
                      if (err) return rejectInsert(err);
                      resolveInsert();
                    }
                  );
                });
              }
            }
          }
          
          // 例文を更新（既存のものを削除して新しく追加）
          if (wordData.examples) {
            // 既存の例文を削除
            await new Promise((resolveDelete, rejectDelete) => {
              db.run(`DELETE FROM examples WHERE word_id = ?`, [wordId], (err) => {
                if (err) return rejectDelete(err);
                resolveDelete();
              });
            });
            
            // 新しい例文を追加
            if (wordData.examples.length > 0) {
              for (const ex of wordData.examples) {
                await new Promise((resolveInsert, rejectInsert) => {
                  db.run(
                    `INSERT INTO examples (word_id, example, translation)
                     VALUES (?, ?, ?)`,
                    [wordId, ex.example, ex.translation || ''],
                    (err) => {
                      if (err) return rejectInsert(err);
                      resolveInsert();
                    }
                  );
                });
              }
            }
          }
          
          // 語源を更新（既存のものを削除して新しく追加）
          if (wordData.etymologies) {
            // 既存の語源を削除
            await new Promise((resolveDelete, rejectDelete) => {
              db.run(`DELETE FROM etymologies WHERE word_id = ?`, [wordId], (err) => {
                if (err) return rejectDelete(err);
                resolveDelete();
              });
            });
            
            // 新しい語源を追加
            if (wordData.etymologies.length > 0) {
              for (const ety of wordData.etymologies) {
                await new Promise((resolveInsert, rejectInsert) => {
                  db.run(
                    `INSERT INTO etymologies (word_id, etymology)
                     VALUES (?, ?)`,
                    [wordId, ety.etymology],
                    (err) => {
                      if (err) return rejectInsert(err);
                      resolveInsert();
                    }
                  );
                });
              }
            }
          }
          
          // 関連語を更新（既存のものを削除して新しく追加）
          if (wordData.related_words) {
            // 既存の関連語を削除
            await new Promise((resolveDelete, rejectDelete) => {
              db.run(`DELETE FROM related_words WHERE word_id = ?`, [wordId], (err) => {
                if (err) return rejectDelete(err);
                resolveDelete();
              });
            });
            
            // 新しい関連語を追加
            if (wordData.related_words.length > 0) {
              for (const rel of wordData.related_words) {
                await new Promise((resolveInsert, rejectInsert) => {
                  db.run(
                    `INSERT INTO related_words (word_id, related_word, relationship_type)
                     VALUES (?, ?, ?)`,
                    [wordId, rel.related_word, rel.relationship_type || ''],
                    (err) => {
                      if (err) return rejectInsert(err);
                      resolveInsert();
                    }
                  );
                });
              }
            }
          }
          
          // トランザクションをコミット
          await new Promise((resolveCommit, rejectCommit) => {
            db.run('COMMIT', (err) => {
              if (err) {
                db.run('ROLLBACK');
                return rejectCommit(err);
              }
              resolveCommit();
            });
          });
          
          resolve();
        } catch (error) {
          // エラーが発生した場合はロールバック
          db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  }
}

module.exports = new WordRepository(); 