# Roadmap / 検証記録

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

根拠節：実装履歴／現在まさにやっていること／今一番最初に対応する内容／次に予定している大きな工程。

## Documentation Review Fix（文書版0.1・過去の文書工程）
Founder依頼に基づき、実装状況、恒久Safety Guard、学びながら進める協働方針を追加した文書工程。この工程ではアプリVersion変更・B.3.4実装を行わなかった。

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

引き継ぎ時点では、Text時刻編集は2026/09/17 00:56作成に対し00:25（31分前）の保存拒否まで確認済みで、Picker改善・再起動後のACTIVE維持の追加確認は残っていた。後続B.3.4の確認範囲を以下に別記する。

## v2.6.0-B.3.4 / Text Time Picker UX Hotfix（IMPLEMENTED・実機は範囲限定CONFIRMED）
根拠：本タスクのFounder承認・実装完了／自動確認報告と、2026-09-21受領のFounder実機確認報告。今回は結果を文書へ反映するのみ。項目別Statusの正本は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)。

### 確認済み範囲と残る確認
- CONFIRMED：Bottom Sheet表示、キーボード不要、表示時刻の変更・保存、現在Active所属の維持。
- CONFIRMED：ちょうど30分前の候補の選択・保存、日跨ぎの「前日 HH:mm」表示と保存後のActive所属維持、Cancelで時刻・所属が変わらないこと。
- CONFIRMED：アプリ完全終了→再起動後のtimelineTimeと同じActive Schedule所属の保持。確認したTextの範囲に限定する。
- IMPLEMENTED・自動確認済み／実機未確認：内部の秒・ミリ秒保持、正確な上下限と範囲外・未来の保存拒否など。30分前候補の実機合格を内部精度や全境界の実機合格に広げない。
- IMPLEMENTED・コードレビュー／自動確認済み／実機未確認：Text時刻編集の注意・エラーToastの4000ms。実機で安全に再現できる操作がないため未確認を残す。他Toastの1900ms維持も、今回改めて実機確認済みとはしない。

### 保護する回帰項目
既存旅行・12 Photos・写真IndexedDB、A.2保存方式、B.1.1候補分離、B.2.1 Guard、B.3 Snapと手動actual尊重、B.3.3日跨ぎ写真/Text所属。今回のText実機結果でこれら全体を再確認済みにしない。

### 別Issue：Cross-Day Schedule監査
監査内容の扱いはFounder判断待ち。今回まだ実装・正式仕様化しない。B.3.4で承認・実装した現在Active所属の限定的な維持を超えるルールは追加しない。

## その後の順序
1. Text timelineTime picker：IMPLEMENTED。上記の範囲は実機CONFIRMED、未確認項目は残す。
2. 再起動保持：今回のTextのtimelineTime・同じActive所属はCONFIRMED。他の状態・復旧ケースの追加確認とは分ける。
3. Schedule終了後のQuick Recordが寄り道または次Activeへ流れることを確認。
4. Active Schedule境界修正時のRecord再所属。
5. Fixed / Flexible Schedule。
6. Travel Style Policy。
7. Arrival State Machine。
8. Notification Event System。
9. 3スタイルのNotification Policy実装。
10. Undo / Change History。

その後：Native Photo Import、Native Video Import、MediaAsset、Original/Preview/Poster、Grouping、Free Canvas、Flexible Timeline、Drag & Bundle、Home refresh、Calendar、My Page等。期限・細部・完成状態は未記載。Drag & Bundleの詳細ジェスチャー仕様を過去チャットの例から補完しない。
