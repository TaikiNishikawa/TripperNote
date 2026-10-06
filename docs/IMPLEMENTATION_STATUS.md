# Implementation Status

仕様の採用、実装、実機確認を別々に管理する。製品仕様は関連Spec、次工程は[ROADMAP.md](ROADMAP.md)、保護事項は[REGRESSION_GUARDS.md](REGRESSION_GUARDS.md)を参照する。

## 根拠とStatus
B.3.3までの記録は、開発引き継ぎ「Pasted markdown.md」を根拠として既存BootstrapのROADMAP / ARCHITECTURE / DECISIONSに転記された記録を整理したもの。Review Fixでは原本がリポジトリ内に見つからず、原本との再照合は未実施。これらは引き継ぎ時点の報告であり、過去の実装日・確認日は不明。

B.3.4は本タスクのFounder承認・実装完了報告・自己レビューと自動確認結果、および2026-09-21に受領したFounderの実機確認報告を根拠とする。反映日：2026-09-21。実機テストの実施日時・端末詳細は未記載。今回の文書更新でコード・自動テスト・実機を再検証したものではない。

| Status | 意味 |
|---|---|
| DECIDED | 仕様・方針として確定。実装・実機確認の証明ではない。 |
| NOT IMPLEMENTED | 採用済みでも、対象機能の実装をまだ行っていない。 |
| IMPLEMENTED | 実装済みと報告されている。実機合格を意味しない。 |
| CONFIRMED | 明記された範囲に実機確認の記録がある。全機能の合格を意味しない。 |
| PROPOSED | 提案・候補。実装済みや正式採用へ格上げしない。 |
| UNKNOWN | 根拠不足、未確認、または合格を確認できない。 |

Statusは単一の進捗順位ではない。不具合が実機で発見されたことを、その版の実機合格（CONFIRMED）として扱わない。NEXTは工程の優先順位であり、確認Statusではない。

## 実装・確認の記録
| Version / 内容 | 実装Status | 実機Status・記録範囲 | 未確認・制限 |
|---|---|---|---|
| v2.5.8-B.3.1 / 旧安定Baseline | IMPLEMENTED | UNKNOWN：旧安定Baselineとの報告はあるが、この版の個別実機確認記録は未記載。 | commit 13a2c03・同名tagの記録。mainの実機確認済みという報告だけで、この版の確認範囲を推定しない。現在のHEADを意味しない。 |
| v2.6.0-A.1 / Phase 4A Foundation | IMPLEMENTED | UNKNOWN（合格なし）：実機でQuotaExceededError発生。 | A.2で修正。A.1の二重保存へ戻さない。 |
| v2.6.0-A.2 / Storage Architecture Hotfix | IMPLEMENTED | CONFIRMED：起動、北杜・小淵沢データ、12 Photos、既存Schedule保存が実機合格。 | 現在の全データ・全操作を今回再検証したものではない。 |
| v2.6.0-B.1 / Timeline Skeleton | IMPLEMENTED | CONFIRMED（限定）：原本に実機で吐竜の滝写真が既存Schedule内へ投影・表示されたことの確認記録あり。 | Candidate Bundle情報混線の問題を発見。v2.6.0-B.1全体の完全合格を意味しない。 |
| v2.6.0-B.1.1 / Candidate Bundle Projection Hotfix | IMPLEMENTED | CONFIRMED：古いslot-level timeNoteによる候補混線の修正が実機合格。 | 候補別情報の分離を維持。 |
| v2.6.0-B.2 / Quick Record Bar + Text Block | IMPLEMENTED | UNKNOWN（確認環境の明記なし）：過去旅行への現在Text追加Guardを確認した記録。 | Camera起動の問題が残る。既存要約だけでは実機確認と断定しない。 |
| v2.6.0-B.2.1 / Quick Record Guard Hotfix | IMPLEMENTED | CONFIRMED：終了済み・開始前Camera不可、Text read-only、＋維持が実機合格。 | Guardの対象・例外を勝手に拡張しない。 |
| v2.6.0-B.3 / Schedule Progression Core | IMPLEMENTED | CONFIRMED：23:53開始→actual 23:45、終了→23:45–23:55、予定→進行中→完了を実機確認。 | 開始・終了・スキップ、planned/actual分離、±15分Snapの実装報告。全境界・スキップの個別実機結果はUNKNOWN。 |
| v2.6.0-B.3.1 / Cross-Day Active Schedule Assignment Hotfix | IMPLEMENTED | UNKNOWN（合格なし）：再起動後に状態喪失、Photo LinkerはDAY 2・予定に紐付けない状態。 | 日付よりActiveを優先する修正だけで永続化合格としない。 |
| v2.6.0-B.3.2 / State Persistence + Cross-Day Linker Hotfix | IMPLEMENTED | UNKNOWN：既存00:01写真の削除で復旧証拠がなく、回復できず。 | Core起動時読戻しの修正報告はあるが、実機合格と断定しない。 |
| v2.6.0-B.3.3 / Overnight Recovery Hotfix | IMPLEMENTED | CONFIRMED（限定）：00:53写真がDAY 1・9月16日23:55開始ScheduleへLINKED・保存表示、DAY 2空。00:56「深夜のテキストテスト」も同Schedule所属。 | 引き継ぎ時点では再起動後のACTIVE維持は未確認。後続B.3.4のTextに関する確認は下記に別記し、この版全体の合格へ広げない。限定復旧条件を維持。 |
| v2.6.0-B.3.4 / Text Time Picker UX Hotfix | IMPLEMENTED | CONFIRMED（範囲限定）：Picker、保存、現在Active所属維持、30分前候補、日付跨ぎ、Cancel、完全終了・再起動後のText時刻と同じActive所属の保持。下記の項目別記録を参照。 | Toast時間・内部の秒／ミリ秒は実機未確認。全項目を一括でCONFIRMEDにしない。 |
| Cross-Day Schedule v1 / 新規作成・編集 | NOT IMPLEMENTED（仕様はDECIDED） | UNKNOWN：実機未確認。 | B.3.4のText時刻編集や既存Activeの日跨ぎ所属とは別Issue。Version・実装工程は未決定。 |

引き継ぎ時点のISO手入力では、2026/09/17 00:56作成に対する00:25（31分前）の保存拒否はCONFIRMED。この過去結果をB.3.4の全境界の実機合格へ転用しない。

## B.3.4 項目別確認結果

実装：IMPLEMENTED。以下のCONFIRMEDはFounderの今回の実機報告だけを対象とする。

| 対象 | 実機Status・確認範囲 |
|---|---|
| Picker表示 | CONFIRMED：Text時刻PickerがBottom Sheetで表示される。 |
| 入力操作 | CONFIRMED：キーボード入力が出ない。 |
| 時刻保存 | CONFIRMED：表示時刻を変更して保存できる。 |
| Active所属 | CONFIRMED：現在Active Schedule内のTextを時刻変更しても同じSchedule内に残る。 |
| 30分前の境界 | CONFIRMED：ちょうど30分前の候補を選択・保存できる。内部の秒・ミリ秒を画面で確認した意味ではない。 |
| 日付跨ぎ表示 | CONFIRMED：「前日 HH:mm」が表示される。 |
| 日付跨ぎ保存 | CONFIRMED：日付を跨ぐ時刻を保存しても同じActive Schedule所属を維持する。 |
| Cancel | CONFIRMED：キャンセルで時刻・所属を変更しない。 |
| 再起動後の時刻 | CONFIRMED：アプリ完全終了→再起動後もtimelineTimeが保持される。 |
| 再起動後の所属 | CONFIRMED：再起動後も同じActive Schedule所属を保持する。一般的な全Schedule状態・復旧ケースの検証へ広げない。 |

### 自動確認と実機未確認の区別

- Text時刻編集の注意・エラーToast：IMPLEMENTED（4000ms）。コードレビュー・自動確認済み。実機で安全に再現できる操作がないため、約4秒の実表示時間は実機未確認。
- 他Toast：既定1900msを維持する実装をコードレビュー・自動確認済み。今回、約1.9秒の実表示時間を改めて実機CONFIRMEDとはしない。
- 内部の秒・ミリ秒保持：IMPLEMENTED。`C - n × 60,000ms`の候補生成、正確な上下限、基本候補と一致しない既存timelineTimeの保持は自動確認済み。実機画面だけでは内部精度を直接確認できず、秒・ミリ秒まで実機確認済みとはしない。
- 作成時刻そのものの境界、範囲外・未来の保存拒否、createdAt不変、編集中のActive変更による保存中止などは実装時の自己レビュー・自動確認の記録に留める。今回の10項目にない操作を実機合格へ追加しない。
- 実装完了時の19項目の自動確認は隔離Chrome・一時データによるもの。実機結果とは別の根拠として扱い、今回再実行していない。

## 確定仕様と確認結果の分離
DECIDED：A.2保存方針、Candidate情報分離、Quick Record Guard、±15分Snap（手動actual除外）、日付境界よりActive優先、Text createdAt不変・timelineTimeの30分制限。根拠は[DECISIONS.md](DECISIONS.md)と関連Spec。これらの仕様Statusだけで実装・実機合格を推定しない。

## 更新ルール / SPEC GAP
- 新しい実装・実機結果は対象版、確認項目、結果、根拠、残課題を記録する。日付が不明なら不明のままにする。
- 原本再照合、Baselineの個別テスト記録は未完。再起動保持はB.3.4のText時刻・同じActive所属についてのみ上記のとおり確認済み。
- Cross-Day Schedule v1は今回のFounder DecisionでDECIDED。実装はNOT IMPLEMENTED、実機StatusはUNKNOWN。B.3.4で確認した限定的なActive所属維持を、Scheduleの翌日終了入力・保存の実装や実機合格として扱わない。実装上の懸念は[ROADMAP.md](ROADMAP.md)に記録する。
- 現在のworking treeと仕様の機能上の差異は今回未調査。コードから製品仕様を補完しない。
