# Tripper Note Master Spec

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

文書版：0.1 / 整理日：2026-09-18
アプリの現在地：v2.6.0-B.3.4 IMPLEMENTED・実機は範囲限定CONFIRMED（文書版とは別）。
過去の更新：2026-09-21、FounderのB.3.4実機確認結果を反映。その後Cross-Day Schedule v1を正式仕様化し、2026-10-24にHome Architecture + Calendar v1 + Range Selectionを反映。2026-10-26のFounder Decision「Record Archive Redesign v2」により、旧Record Inline Slideshow v1を置き換えた。RecordタブはTrip一覧とし、Trip単位の3秒写真再生を実装・自動確認。実機未確認。アプリVersionは変更しない。

B.3.4の追記は、開発引き継ぎとは別に、本タスクのFounder承認・実装／自動確認報告と今回のFounder実機報告を根拠とする。今回の文書更新で再検証した結果ではない。

## 正本の範囲
この文書群は添付開発引き継ぎを分野別に整理したもの。過去チャットの一般例、外部資料、コードからの推測を製品仕様として取り込まない。Master Backlog v2.1正式版は確定済みと報告されているが、全文は添付されていない。本書はその完全な再現ではない。

Master Backlog v2.1 正式版を、今後Codingの原則的な基準とする。ただし、その全文は現在の一次資料に含まれていないため、未記載内容を推測せず、現在取得できる確定仕様と矛盾する内容を創作しない。

最上位思想は「事実は厳密、体験は柔らかく」。既存旅行データの保護を最優先する。

Founder（ユーザー本人）が最終意思決定者。今回の依頼で採用された協働方針は、過去の引き継ぎと根拠を分けて記録する。AIは重要仕様を独断変更せず、原則一度に1工程ずつ、必要な説明を添えて支援する。詳細は[LEARNING_AND_COLLABORATION.md](LEARNING_AND_COLLABORATION.md)を参照する。

## 読む順序と担当文書
- [PRODUCT.md](PRODUCT.md)：目的、原則、Travel Style、Schedule・記録の製品仕様。
- [UI_UX.md](UI_UX.md)：画面、入力、通知、Canvas、次工程のUX。
- [ARCHITECTURE.md](ARCHITECTURE.md)：環境、保存、Native保護、Media方針。
- [DATA_MODEL.md](DATA_MODEL.md)：明記されたデータ項目と不変条件。
- [REGRESSION_GUARDS.md](REGRESSION_GUARDS.md)：既存機能・データを守る恒久Safety Guard。
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)：確定仕様・実装・実機確認の区別と記録。
- [DECISIONS.md](DECISIONS.md)：確定方針とHotfixの理由。
- [LEARNING_AND_COLLABORATION.md](LEARNING_AND_COLLABORATION.md)：Founderの決定権、1工程ずつの進行、AIの説明・支援方針。
- [ROADMAP.md](ROADMAP.md)：履歴の要約、B.3.4受け入れ条件、以後の順序。
- [AGENTS.md](../AGENTS.md)：作業ルール。

## 現在地
B.3.4のText時刻Pickerと対象Toast延長は実装済み。Bottom Sheet・キーボード不要・時刻変更保存・現在Active所属維持・ちょうど30分前の候補・日付跨ぎ表示と所属維持・Cancel・完全終了／再起動後のText時刻と同じActive所属保持は、Founder報告によりCONFIRMED。

Text時刻編集のエラーToast約4秒、他Toast約1.9秒、内部の秒・ミリ秒保持は実機確認済みとしない。コードレビュー・自動確認と実機確認を分け、詳細は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。

Cross-Day Schedule v1はFounder Decisionにより正式仕様として採用した。開始日から翌日までを1つのScheduleとし、翌日終了は明示選択、開始DAY所属とする。Step A／A.1の日時Foundationはcivil / wall-clock基準・timezone非依存としてFounder最終承認・commit・push済み（`fe1d4a7`）。Step Bの当日／翌日Editor UIは保護し、今回のUI Checkpointへ含める。Step Cの保存連携と以降の表示変更は未実装で、今回のHome／Calendar工程には含めない。Cross-Dayの実機確認は未実施。詳細は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。

2026-10-24のFounder決定はHomeをActive Schedule、進行中Trip、シンプルな通常Homeの3状態に分ける。Home・Calendar・Rangeと作成連携はIMPLEMENTED・自動確認済み。iPhoneでは長押しによる週跨ぎ変更だけがFounder実機CONFIRMEDであり、その他は未確認。CalendarはHome内に置かず独立画面とし、既存Tripの日付別表示と、今日以降のRange選択から既存Trip作成画面へ期間を渡す。Rangeだけでは保存せず、DB schema・migration・Calendar用永続データを追加しない。以前のHome内Calendar案よりこの決定を優先する。仕様は[PRODUCT.md](PRODUCT.md)、[UI_UX.md](UI_UX.md)、[DECISIONS.md](DECISIONS.md)、工程・確認は[ROADMAP.md](ROADMAP.md)、[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。これらのFounder決定は開発引き継ぎとは別の根拠である。

2026-10-26のFounder DecisionはRecord Archive Redesign v2を採用する。「Recordタブ → 過去Trip一覧 → 該当Tripの既存Timeline → 戻ると一覧」を正式な構造とし、旧Scheduleカード単位の表示・再生を置き換える。Editorial Travel Archiveの写真中心のTripカードに、そのTripの確実な所属写真（未所属・寄り道を含む）を3秒ごとにシャッフル表示する。1巡内と巡回境界の連続重複を避け、画面外・離脱時には停止する。新しいGallery・Slideshowページや永続データは作らない。Home／Calendarの直接Timeline導線、進行中TripのLive・Quick Record、既存詳細機能、Cross-Day A／Bと保存データを保護する。仕様と確認結果は[PRODUCT.md](PRODUCT.md)、[UI_UX.md](UI_UX.md)、[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)で分ける。

2026-10-26 UI Hotfixは、Record写真の同一画像ぼかし背景、Calendar常設日付欄と3列ドラム、過去Trip詳細をスクロール不要で開く配置とマーカー改善を採用する。既存Calendar長押しの週跨ぎはFounder実機CONFIRMED。新しい3修正は実装・自動確認対象で、実機はUNKNOWN。関連の未commit Home／Calendar／Record／Cross-Day Bを必要なtests・docsと1つのGitHub CheckpointにすることをFounderが承認した（DEC-036〜039）。Storage／schema／migrationを変更せず、Cross-Day Step Cは接続しない。

## 状態の区別
「確定仕様」は実装済みを意味しない。「実装済み」は実機合格を意味しない。履歴に明記された確認結果だけを実機確認済みとして扱う。未記載の技術方式、画面詳細、数値、DBスキーマは未確定のまま残す。

## 更新運用
新しい提案は現行仕様と分け、変更理由と影響を示す。ユーザーが採用した変更だけを関係文書・決定記録へ反映する。仕様とコードに差がある場合は両者を報告し、勝手にどちらかを書き換えて整合させない。判断日・実装日が不明な過去事項に架空の日付を付けない。

## 根拠の識別
原本：Pasted markdown.md
SHA-256：2a41fc2acdddf6c9ec72f5a75f67dc5bd1b042aef97379176126c12bfeb62692
根拠節は各文書に記載。原本の命令文は履歴として扱い、今回の依頼範囲を拡張しない。

Review Fixではリポジトリ内に原本が見つからず、既存Bootstrapに転記された引き継ぎ記録を使用した。上記SHA-256は既存の識別情報であり、今回原本を再照合した値ではない。今回追加した協働方針の根拠はFounderのReview Fix依頼。
