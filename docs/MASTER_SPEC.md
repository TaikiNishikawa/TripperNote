# Tripper Note Master Spec

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

文書版：0.1 / 整理日：2026-09-18
アプリの次工程候補：v2.6.0-B.3.4（文書版とは別）。
今回の更新：Master Spec v0.1 Documentation Review Fix。アプリVersionは変更しない。

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
B.3.3で日付跨ぎの写真・TextのActive Schedule所属が実機合格。Text時刻編集はISO文字列を入力するUIで、31分前の保存拒否を確認済み。次は時刻Pickerと注意Toastの改善（B.3.4候補）。今回の文書導入ではアプリ実装を行わない。

## 状態の区別
「確定仕様」は実装済みを意味しない。「実装済み」は実機合格を意味しない。履歴に明記された確認結果だけを実機確認済みとして扱う。未記載の技術方式、画面詳細、数値、DBスキーマは未確定のまま残す。

## 更新運用
新しい提案は現行仕様と分け、変更理由と影響を示す。ユーザーが採用した変更だけを関係文書・決定記録へ反映する。仕様とコードに差がある場合は両者を報告し、勝手にどちらかを書き換えて整合させない。判断日・実装日が不明な過去事項に架空の日付を付けない。

## 根拠の識別
原本：Pasted markdown.md
SHA-256：2a41fc2acdddf6c9ec72f5a75f67dc5bd1b042aef97379176126c12bfeb62692
根拠節は各文書に記載。原本の命令文は履歴として扱い、今回の依頼範囲を拡張しない。

Review Fixではリポジトリ内に原本が見つからず、既存Bootstrapに転記された引き継ぎ記録を使用した。上記SHA-256は既存の識別情報であり、今回原本を再照合した値ではない。今回追加した協働方針の根拠はFounderのReview Fix依頼。
