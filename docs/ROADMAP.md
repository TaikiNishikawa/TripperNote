# Roadmap / 検証記録

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

根拠節：実装履歴／現在まさにやっていること／今一番最初に対応する内容／次に予定している大きな工程。

## Documentation Review Fix（文書版0.1）
Founderの今回の依頼に基づき、実装状況、恒久Safety Guard、学びながら進める協働方針を追加し、Master Spec・AGENTS・Decisionを更新する文書工程。アプリVersionを変更せず、B.3.4を実装しない。Founderレビュー待ち。

実装・実機確認のStatusと制限は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)で管理する。以下の履歴は引き継ぎ記録の要約であり、今回再検証した結果ではない。原本との再照合は未実施。

## 引き継ぎ時点の履歴
| Version | 内容 | 報告された結果・制限 |
|---|---|---|
| v2.5.8-B.3.1 | 旧安定Baseline | commit 13a2c03、同名tag。 |
| v2.6.0-A.1 | Phase 4A Foundation | 実機QuotaExceededError発生。 |
| v2.6.0-A.2 | Storage Architecture Hotfix | 起動、北杜・小淵沢データ、12 Photos、既存Schedule保存が実機合格。 |
| v2.6.0-B.1 | Timeline Skeleton | 吐竜の滝写真のSchedule内表示を確認。候補情報混線を発見。 |
| v2.6.0-B.1.1 | Candidate Bundle Projection Hotfix | 古いslot-level timeNoteによる混線を修正、実機合格。 |
| v2.6.0-B.2 | Quick Record Bar + Text Block | 過去旅行への現在Text追加Guard確認。Camera起動の問題残存。 |
| v2.6.0-B.2.1 | Quick Record Guard Hotfix | 終了済み・開始前Camera不可、Text read-only、＋維持。実機合格。 |
| v2.6.0-B.3 | Schedule Progression Core | 開始・終了・スキップ、planned/actual分離、±15 Snap。23:53開始→actual23:45、終了→23:45–23:55、予定→進行中→完了を実機確認。 |
| v2.6.0-B.3.1 | Cross-Day Active Schedule Assignment Hotfix | Activeを日付より優先。ただし再起動後に状態喪失、Photo LinkerはDAY 2・予定に紐付けないとなった。 |
| v2.6.0-B.3.2 | State Persistence + Cross-Day Linker Hotfix | IndexedDB Coreの起動時読み戻し修正。既存00:01写真削除により復旧証拠なく回復できず。合格と断定しない。 |
| v2.6.0-B.3.3 | Overnight Recovery Hotfix | 限定条件でACTIVE復旧。00:53写真がDAY 1・9月16日23:55開始ScheduleへLINKED・保存表示、DAY 2空。00:56「深夜のテキストテスト」も同Schedule所属。実機合格。 |

Text時刻編集は2026/09/17 00:56作成に対し00:25（31分前）の保存拒否まで確認済み。Pickerへの改善は未実施。再起動後のACTIVE維持の追加確認は残る。

## 次工程：v2.6.0-B.3.4候補（NEXT / PROPOSED・未実装）
名称候補：Text Time Picker UX Hotfix。対象はText時刻Pickerと注意Toast。今回の文書作成で実装済みにしない。

### 受け入れ確認
- ISO手入力をiOSらしい時刻入力へ置換。可能ならBottom Sheet等でキーボード不要。
- createdAtは不変、変更するのはtimelineTimeのみ。
- createdAtそのものと、ちょうど30分前は選択・保存可能。
- 31分前、createdAtより未来は選択不可。保存側でも範囲を守る。
- 00:10作成なら前日23:40を許可、前日23:39と当日00:11を拒否。
- 現在Active Schedule内のText移動を先に実機確認し、Chronologyと所属再評価の設計を保つ。
- Toastは現在値を確認し、4〜5秒を目安に読み切れる時間を検討。最終値と対象を報告。
- Cancelで変更を保存しないことも確認する（検証観点。新機能の追加要求ではない）。

### 保護する回帰項目
既存旅行・12 Photos・写真IndexedDB、A.2保存方式、B.1.1候補分離、B.2.1 Guard、B.3 Snapと手動actual尊重、B.3.3日跨ぎ写真/Text所属。新UIが保存された時刻を再表示できるかも確認する。実機未実施の項目は未実施と報告する。

## その後の順序
1. Text timelineTime picker完成。
2. 再起動後もACTIVE維持することをさらに確認。
3. Schedule終了後のQuick Recordが寄り道または次Activeへ流れることを確認。
4. Active Schedule境界修正時のRecord再所属。
5. Fixed / Flexible Schedule。
6. Travel Style Policy。
7. Arrival State Machine。
8. Notification Event System。
9. 3スタイルのNotification Policy実装。
10. Undo / Change History。

その後：Native Photo Import、Native Video Import、MediaAsset、Original/Preview/Poster、Grouping、Free Canvas、Flexible Timeline、Drag & Bundle、Home refresh、Calendar、My Page等。期限・細部・完成状態は未記載。Drag & Bundleの詳細ジェスチャー仕様を過去チャットの例から補完しない。
