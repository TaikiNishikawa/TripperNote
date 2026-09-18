# Decisions

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

根拠節：Product思想／各確定仕様節／Storage Architecture／実装履歴／今一番最初に対応する内容。
以下のIDは本書での参照用。DEC-001〜012は決定日が原本にないため不明とし、文書整理日を採用日にしない。実装・確認の詳細と制限は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。

| ID | 状態 | 決定・保護事項 | 根拠・理由 |
|---|---|---|---|
| DEC-001 | 確定 | 事実は厳密、体験は柔らかく。手動優先、Undo・修正、予定外も正常。 | Product思想。 |
| DEC-002 | 確定 | 3 Travel Styleは共通データ、介入強度を変更。 | ゆったりでも自動切替し、操作負荷を抑える。 |
| DEC-003 | 確定・B.3確認 | planned/actual分離、±15分を含むSnap。手動編集actualは除外。 | 予定と事実を分ける。実機23:53→23:45確認。 |
| DEC-004 | 確定 | 50%以上重複で予定束、未選択null、自動確定なし。 | ユーザーが候補を選ぶ。移動は候補別計算。 |
| DEC-005 | 実装・A.2合格 | CoreはIndexedDB、localStorageは小さい互換・設定中心。 | A.1のV25/V26二重保存でQuotaExceededError。 |
| DEC-006 | 実装・B.1.1合格 | Candidate情報の分離を維持。 | slot-level timeNoteが別候補の内容を表示していた。 |
| DEC-007 | 実装・B.2.1合格 | 終了済み・開始前のCamera不可、Text read-only、＋維持。 | 過去旅行でもCameraが起動した問題。 |
| DEC-008 | 実装・検証経過あり | 起動時Core読戻しと限定Overnight復旧を維持。 | B.3.1で再起動後状態喪失、B.3.2修正、B.3.3日跨ぎ所属合格。追加永続化確認は未完。 |
| DEC-009 | 確定・B.3.3確認 | 日付よりActive Schedule優先。 | 翌日写真/Textを前日継続中Scheduleへ所属。 |
| DEC-010 | 確定 | Text createdAt不変、timelineTimeはcreatedAt−30分〜createdAt。Canvasは適用外。 | 事実時刻を守り、記録時刻を調整可能にする。 |
| DEC-011 | 確定・将来方針 | Mediaには信頼できるcapturedAt必須、Mergeは確認。Original保持・非破壊trim。 | 時系列と原本を保護する。 |
| DEC-012 | 次工程・未実装 | B.3.4候補：Text時刻Picker、日跨ぎ、Toast延長。 | ISO手入力と短い注意表示の改善希望。 |

## Documentation Review Fixで採用した協働方針
以下は今回のFounder依頼を根拠とする新規Decision。決定日は2026-09-18（今回の依頼日）であり、過去の採用日を推定したものではない。状態DECIDEDは方針採用を意味し、アプリ実装・実機確認を意味しない。

| ID | 状態 | 決定内容 | 理由・影響 |
|---|---|---|---|
| DEC-013 | DECIDED | ユーザー本人がTripper NoteのFounder兼最終意思決定者。 | Product・開発の意思決定責任を明確にする。 |
| DEC-014 | DECIDED | AIは重要なProduct仕様・UX・Architectureを独断で確定・変更しない。 | 提案と現行仕様を分け、Founderが採用した内容だけを反映する。 |
| DEC-015 | DECIDED | 原則、一度に1工程ずつ進める。 | 変更→確認→必要なら実機テスト→結果確認→次工程を守る。 |
| DEC-016 | DECIDED | UI/UXは可能な限り実機・Screenshotを確認しながら進める。 | 実際の見え方と操作を重視し、未確認は明記する。 |
| DEC-017 | DECIDED | AIは必要に応じ初心者向けの基礎解説を行う。 | Founderがアプリ開発・AI開発を学べるよう短く説明し、反復や大量説明を避ける。 |
| DEC-018 | DECIDED | AI運用・AIチーム設計ChatをAI Support Partner＝「Founder直属の部下兼相棒」とする。最終意思決定者ではない。 | 判断支援・AIチーム運用・指示設計・Spec管理・過剰変更防止・工程整理・初心者向け解説・専門AI間の整合性管理を担う。 |

関連文書：[LEARNING_AND_COLLABORATION.md](LEARNING_AND_COLLABORATION.md)、[MASTER_SPEC.md](MASTER_SPEC.md)、[AGENTS.md](../AGENTS.md)。実装・検証状態：協働ルールを文書化。アプリ変更・実機検証は今回の対象外。

## 未決定
Pickerの具体実装、Toastの最終秒数（4〜5秒は目安）、未記載のDB詳細、将来機能の詳細。候補や希望を実装済み・採用済みの技術方式に格上げしない。

## 今後の追記形式
ID／状態（提案・採用・撤回等）／決定日（不明なら不明）／現行仕様／変更内容／理由／影響／根拠となるユーザー決定／関連文書／実装・検証状態を記録する。ユーザーの採用前に提案で現行仕様を上書きしない。
