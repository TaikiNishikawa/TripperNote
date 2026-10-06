# Data Model

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

根拠節：Schedule基本仕様／±15分 Snap Rule／予定束／Fixed / Flexible／Text Block仕様／Free Canvas／Photo / Video Import／Storage Architecture／実装履歴。
これは論理仕様の整理であり、新スキーマや移行定義ではない。型・必須性・DBキー等が未記載の項目は補完しない。

| 対象 | 明記された項目・状態 | 制約 |
|---|---|---|
| Schedule | plannedStartAt / plannedEndAt / actualStartAt / actualEndAt | plannedとactualを別保持。plannedStartAt / plannedEndAtは日付を含む完全なdatetime。 |
| Schedule状態 | UPCOMING / ACTIVE / EXTENDED / COMPLETED / SKIPPED | 実旅行上Activeは原則1つ。全遷移条件は未記載。 |
| Choice Slot状態 | CHOICE_UNSELECTED / SELECTED | Schedule状態と区別。 |
| ChoiceSlot | selectedCandidateId | 初期null。ユーザー選択で確定。 |
| 調整可能Schedule | earliestStartAt / latestStartAt / plannedDuration / minimumDuration / allowAutoAdjustment | 固定のplannedを自動変更しない。 |
| Text | createdAt / timelineTime | createdAt不変、timelineTime初期値=createdAt。 |
| Media | capturedAt | Timeline投入には信頼できる値必須。事実を改変しない。 |
| Video区間 | trimStart / trimEnd | 使用区間最大2分、Original全体保持。 |
| 出発計算 | latestDepartureAt / predictedTravelDuration / safetyBuffer | plannedStartAt − predictedTravelDuration − safetyBuffer。 |
| 既存互換構造 | slot.v21のactive / actualStartAt / actualEndAt | B.3.2の欠落修正とCore読み戻しを保護。 |

## Text時刻の不変条件
createdAt − 30分 ≤ timelineTime ≤ createdAt。ちょうど30分前は有効。未来は不可。日付を跨いでも同一の条件。現在時刻から30分前という意味ではない。
例：createdAt 2026/09/17 00:56、00:25は31分前で無効（拒否確認済み）。
例：createdAt 2026/09/17 00:10、有効範囲は前日23:40〜当日00:10。
CanvasのtimelineTimeは後から自由変更でき、Textの制限を適用しない。

## Cross-Day Schedule v1の不変条件（DECIDED・未実装）
初期対応の終了日は開始日と同じ日または翌日。翌日はユーザーが明示選択する。開始時刻より早い終了時刻から翌日を自動確定しない。当日の同時刻終了は0時間のため保存不可、翌日の同時刻終了は24時間として許可する。

`plannedStartAt` / `plannedEndAt` は日付を含む完全なdatetimeとして保持する。例：`2026-10-06T23:00:00` → `2026-10-07T01:00:00`。UI上の `startTime` / `endTime` だけで日跨ぎを表現しない。予定時間長は `plannedEndAt - plannedStartAt` のdatetime差から算出し、この例は120分となる。既存文書の論理項目 `plannedDuration` に対応する実装上の名称は別途確認する。既存フィールドでの実現を優先し、DB・IndexedDBのschema、localStorage構造、migrationは変更対象としない。

Scheduleの所属DAYは開始日とし、TimelineのカードはそのDAYだけに置く。Activeは日付境界だけで解除せず、翌日のText・Photo等は既存のActive優先に従って所属できる。actualStartAt / actualEndAt、createdAt / capturedAt、およびText・Photoの基本仕様は変更しない。

## 所属とChronology
Active Scheduleを日付境界より優先する。写真・Textが翌日でも継続中の前日Scheduleへ所属できる。Text時刻変更後はChronologyに応じて同じSchedule内または必要な所属先再評価を維持する。厳密な再所属アルゴリズムは未記載。

## B.3.3の限定復旧条件
以下すべてを満たす場合にACTIVE復旧：前日のSchedule／18時以降開始／終了時刻なし／明示完了・スキップなし／翌朝6時前／該当Scheduleが1件のみ。条件を拡張して複数候補から勝手に選ばない。参照する具体的な保存フィールドは原本だけでは確定しない。

## Candidate分離
B.1.1で古いslot-level timeNoteによる候補情報混線を修正。吐竜の滝Candidate「自然散策」と美術館Candidate「美術館鑑賞」を混同しない。

## 未記載
Trip、Timeline、Block、NotificationEvent、MediaAssetの完全なフィールド定義、ID型、関連キー、削除・移行方式は未確定。
