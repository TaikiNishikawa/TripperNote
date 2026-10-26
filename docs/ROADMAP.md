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

### 別Issue：Cross-Day Schedule v1（DECIDED / Step A・B実装済み、保存未接続）
Founderが開始日から翌日に終了するScheduleを正式採用。Product仕様は[PRODUCT.md](PRODUCT.md)、入力・表示は[UI_UX.md](UI_UX.md)、日時と時間長の不変条件は[DATA_MODEL.md](DATA_MODEL.md)、決定は[DECISIONS.md](DECISIONS.md)を参照する。Step A／A.1はFounder最終承認・commit・push済み（`fe1d4a7`）、Step BはEditor UIのみ実装済み・実機未確認。既存のStep B未commit差分を保護し、今回のHome／Calendar実装でStep Cへ接続しない。B.3.4で確認したTextのActive所属は、日跨ぎScheduleの作成・編集全体が実装済みという証拠にはならない。

Implementation Concern：現在のSchedule編集処理では、`startTime / endTime` と `slot.v21.plannedStartAt / plannedEndAt` が同期しない可能性が監査で確認されている。実装時に新規作成・編集・再表示・保存後読戻しの整合性を確認する。終了日時を同日で作る処理、時刻だけから求める時間長、早い終了時刻の拒否も監査で確認された。これは実装課題でありProduct仕様ではない。

実装時の確認観点：当日／翌日の明示選択と自動確定禁止、同時刻の0時間拒否／24時間許可、`plannedEndAt - plannedStartAt` の時間長、開始DAYに1枚だけの表示、0時を跨ぐActiveと翌日Text・Photo所属。既存の±15分Snap、planned/actual分離、B.3.3限定復旧、ChoiceSlot、Fixed / Flexible、保存・読戻しを回帰確認する。実機未確認をCONFIRMEDにしない。

## Home Architecture + Calendar v1 + Range Selection（IMPLEMENTED・実機確認待ち）
2026-10-24のFounder依頼に基づき、Home・独立Calendar・Range操作・既存Trip作成連携を一括実装した。以前のHome内Calendar案と後続候補の順番より今回の明示依頼を優先する。仕様は[PRODUCT.md](PRODUCT.md)、[UI_UX.md](UI_UX.md)、DEC-024〜028を参照する。

受け入れ条件：

- Active Schedule → 進行中Trip → 通常Homeの優先順位。通常Homeの作成CTA、最近の過去Trip 0／1／3／4件、各状態からのCalendar入口。
- Calendarの前月／次月／今日、選択日、月跨ぎ・年跨ぎを含むTrip期間全日のマーカー。日付からTrip／DAY・既存予定／Timelineへ進め、同日の複数Tripを選べること。
- 未来日付のRange開始、延長、短縮、同日までの縮小、端点の追い越し防止、解除・再選択。タップとドラッグ、長押し、pointercancel、縦スクロールの競合を扱うこと。
- 選択した開始日・終了日を既存Trip作成画面へ渡し、ユーザーの保存前にはTrip・DBを変更しないこと。月送りでも選択を維持し、未対応の自動月送り等は報告すること。
- Cross-Day Step A／B、既存Trip／Timeline・写真、保存方式を保護すること。DB schema・migration・データ初期化・不要なNative変更なし。

自動テスト、syntax check、diffレビューの結果と実機未確認項目は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)へ記録する。iPhone Safari／WKWebViewの指操作・safe-area・スクロールは、ブラウザの自動確認だけでCONFIRMEDにしない。stage・commit・push・tagは行わず、Founder実機確認待ちで停止する。

Implementation Concern：既存Trip作成処理の`dateRange`は最大370日である。Calendarからこれを超える期間を渡して日程が黙って欠落しないよう、作成画面への引き継ぎ前に拒否・説明する。これは既存実装の制約であり、新しい旅行期間のProduct上限を確定するものではない。自動月送りは未対応で、通常の月送り・端点選択の補助操作を使う。

## Record Archive Redesign v2（2026-10-26・IMPLEMENTED／実機確認待ち）
Founder DecisionのDEC-032〜035を最新仕様とし、旧Scheduleカード単位のv1を置換する。Record初期表示を過去Trip一覧に刷新し、カード内にTripの全所属写真を3秒間隔で再生する。カードから既存Timeline、戻ると一覧。詳細・写真閲覧・Live機能を維持する。Home／Calendar／RangeとCross-Day A／Bを保護し、Step Cは接続しない。

受け入れ条件：

- RecordタブはTrip一覧、新しい順、0件の自然な空表示。カードはTrip名・期間・写真枚数を読みやすく表示する。
- 同じTripのSchedule所属／未所属／寄り道写真を含め、別Tripの写真を混ぜず重複させない。保存済みデータを修復・再所属しない。
- 0枚・1枚・複数枚、未ロード・読込不可を区別。3秒間隔・一巡内重複なし・巡回境界連続なし・クロスフェード・固定寸法を確認する。
- 画面外・離脱・非表示で停止、再表示で再開。タップ・スクロール・戻る操作と既存Live／Quick Recordを維持する。
- Home／Calendarから正しいTrip／DAYのTimelineへ移動できる。Calendar週跨ぎドラッグと過去記録導線は現行コードと追加テストで確認する。
- 閲覧・再生・遷移によるAPP_DATA／Core／localStorage／写真原本の変更がない。Cross-Day Step A／B・DB schema・migration・Nativeを保護する。

自動確認の詳細・制約は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。次の確認はiPhoneでRecordタブを開き、Trip写真の切替とカード→Timeline→戻るを確認すること。iPhoneの見え方・3秒間隔・スクロール・background停止はUNKNOWN。stage・commit・push・tagは行わない。

## UI Hotfix + GitHub Checkpoint（2026-10-26 Founder依頼）
Recordの縦写真余白、Calendar年月日ドラム、過去Tripの画面内導線・マーカーの3点を一括修正し、自動確認・差分レビュー後に関連未commit変更を1 Checkpointへまとめる。前工程のstage／commit／push禁止より本工程の明示承認（DEC-039）を優先する。先にoriginをfetchし、remote先行・分岐、テスト失敗、データリスクがあればforce pushやrebaseで進めない。

受け入れ条件は、元画像・保存形式・capturedAtの不変、固定写真領域とぼかし背景、独立3列のドラムと確定／Cancel、月末・年跨ぎ・うるう年、過去・逆転拒否と同日許可、ドラッグ／Picker／作成日付の同期、6週・複数Trip・safe-areaで記録導線が見えること。既存Home／Calendar／Record／Cross-Day A／Bを回帰確認する。既存の長押し週跨ぎだけがFounder実機CONFIRMEDで、新修正は実機確認待ち。

commit message：`feat: checkpoint Home Calendar Record UI refresh`。push先：`origin/feature/design-refresh`。push後はlocal／remote HEAD一致とworking treeを確認し、ZIPはリポジトリ外で配布する。

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

その後：Native Photo Import、Native Video Import、MediaAsset、Original/Preview/Poster、Grouping、Free Canvas、Flexible Timeline、Drag & Bundle、My Page等。Home refresh／Calendarは今回のFounder依頼で上記工程へ移した。他の期限・細部・完成状態は未記載。Drag & Bundleの詳細ジェスチャー仕様を過去チャットの例から補完しない。
