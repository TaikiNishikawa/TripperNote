# Implementation Status

仕様の採用、実装、実機確認を別々に管理する。製品仕様は関連Spec、次工程は[ROADMAP.md](ROADMAP.md)、保護事項は[REGRESSION_GUARDS.md](REGRESSION_GUARDS.md)を参照する。

## 根拠とStatus
開発引き継ぎ「Pasted markdown.md」を根拠として既存BootstrapのROADMAP / ARCHITECTURE / DECISIONSに転記された記録を整理した。今回のReview Fixでは原本がリポジトリ内に見つからず、原本との再照合は未実施。以下は引き継ぎ時点の報告であり、現在のコードや実機を再検証した結果ではない。過去の実装日・確認日は不明。

| Status | 意味 |
|---|---|
| DECIDED | 仕様・方針として確定。実装・実機確認の証明ではない。 |
| IMPLEMENTED | 実装済みと報告されている。実機合格を意味しない。 |
| CONFIRMED | 明記された範囲に実機確認の記録がある。全機能の合格を意味しない。 |
| PROPOSED | 提案・候補。実装済みや正式採用へ格上げしない。 |
| UNKNOWN | 根拠不足、未確認、または合格を確認できない。 |

Statusは単一の進捗順位ではない。不具合が実機で発見されたことを、その版の実機合格（CONFIRMED）として扱わない。NEXTは工程の優先順位であり、確認Statusではない。

## 実装・確認の記録
| Version / 内容 | 実装Status（引き継ぎ報告） | 実機Status・記録範囲 | 未確認・制限 |
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
| v2.6.0-B.3.3 / Overnight Recovery Hotfix | IMPLEMENTED | CONFIRMED（限定）：00:53写真がDAY 1・9月16日23:55開始ScheduleへLINKED・保存表示、DAY 2空。00:56「深夜のテキストテスト」も同Schedule所属。 | 再起動後のACTIVE維持の追加確認は未完。限定復旧条件を維持。 |
| v2.6.0-B.3.4 / Text Time Picker UX Hotfix候補 | PROPOSED / NEXT・未実装 | UNKNOWN：実機未確認。 | Picker具体方式、Toast最終秒数は未決定。今回実装しない。 |

Text時刻編集について、2026/09/17 00:56作成に対する00:25（31分前）の保存拒否はCONFIRMED。ISO手入力UIの改善は未実施。この一例だけで全境界や日跨ぎの入力UIを合格にしない。

## 確定仕様と確認結果の分離
DECIDED：A.2保存方針、Candidate情報分離、Quick Record Guard、±15分Snap（手動actual除外）、日付境界よりActive優先、Text createdAt不変・timelineTimeの30分制限。根拠は[DECISIONS.md](DECISIONS.md)と関連Spec。これらの仕様Statusだけで実装・実機合格を推定しない。

## 更新ルール / SPEC GAP
- 新しい実装・実機結果は対象版、確認項目、結果、根拠、残課題を記録する。日付が不明なら不明のままにする。
- 原本再照合、Baselineの個別テスト記録、再起動後ACTIVE維持の追加確認は未完。
- 現在のworking treeと仕様の機能上の差異は今回未調査。コードから製品仕様を補完しない。
