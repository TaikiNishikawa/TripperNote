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

## Home / Calendarのデータ境界（2026-10-24）
Calendarのマーカーと日付別Trip一覧は既存Tripの`startDate` / `endDate`、`days[].date`から計算する。Rangeの開始日・終了日、表示月、選択日、端点編集状態はUI一時状態で、Calendar用の永続データを追加しない。年月日ドラムのdraftと確定RangeもUI一時状態とし、Gregorian componentで月末・うるう年を処理する。Pickerの確定・ドラッグ・CancelだけでTripを保存しない。既存Trip作成の`EDIT_DATA`へ両日付を渡し、明示Save時のみ既存保存処理を使う。Range操作だけで既存Trip・Schedule・記録の日付や所属を変更しない。

## Record Archive v2のデータ境界（2026-10-26）
Tripカードの写真集合は既存の`trip.records`を読み取り、明示`tripId`がある場合はそのTripとの一致を必須にする。旧形式でtripIdが空の場合はTrip内への保存を所属根拠とする。Scheduleの有無、DAY、Plan、撮影時刻・予定時間の近さではTrip写真を除外・再所属しない。動画・Text等を写真に数えず、imageのmetadataはBlob未ロードでも写真として扱う。旧inline画像も表示可能にする。

同じmediaKey／record ID等による重複を避け、Schedule未所属・寄り道・非active Planの写真もそのTripのカードに含める。既存TimelineのScheduleへの投影は保存済みの一意な参照だけを使い、曖昧な参照を時刻や場所で推定修復しない。ChoiceSlotを候補別カードへ複製しない。

Core起動読戻し中、写真読込中、0枚、読込失敗をUIで区別する。原本Blobはreadonlyの`mediaGet`で取得し、失敗時には既存previewを利用する。新しい永続データを作らない。2026-10-26のぼかし背景は前景と同じ読取済みObject URLをCSSで再利用するだけで、画像の保存形式・品質を変更しない。シャッフル順・再生時刻・一覧位置・可視判定・Object URLはUI一時状態で、画面外・離脱時に資源を解放する。写真原本、Schedule所属、actualStartAt／actualEndAt、createdAt／capturedAt、DB schema、localStorage構造、migrationは変更しない。

## Cross-Day Schedule v1の不変条件（DECIDED・Foundation／Editor UIのみ実装）
Step A／A.1はFounder最終承認済み、Step BはUIのみ実装済み。保存連携（Step C）以降は未実装で、今回のHome／Calendar工程でも接続しない。実機未確認。状態の詳細は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。

初期対応の終了日は開始日と同じ日または翌日。翌日はユーザーが明示選択する。開始時刻より早い終了時刻から翌日を自動確定しない。当日の同時刻終了は0時間のため保存不可、翌日の同時刻終了は24時間として許可する。

予定日時のSource of Truthは`slot.v21.plannedStartAt` / `slot.v21.plannedEndAt`で、形式はtimezoneなしの`YYYY-MM-DDTHH:mm:ss`。例：`2026-10-06T23:00:00` → `2026-10-07T01:00:00`。`plannedDurationMinutes`は実UTC経過時間ではなくcivil / wall-clock差を表し、この例は120分、23:00→翌23:00は端末timezone・DSTにかかわらず1440分とする。calendar dateとHH:mmとして有効な値を、端末のDST上で存在しないlocal timeという理由だけで拒否しない。timezone fieldは追加しない。

`startTime` / `endTime`は既存UI・互換処理用として保持し、今後の保存連携時にplanned側と同期する。既存データで不一致でも起動時一括修復・自動修復はしない。現在見えている時刻をEditor初期値として維持し、ユーザーが明示保存した時だけ同期する方針である。通常UIに技術的不一致の警告を追加しない。この同期保存はStep Cの未実装範囲。終了は任意、旅行最終日の翌日指定は不可とし、旅行期間を自動延長しない。DB・IndexedDBのschema、localStorage構造、migrationは変更対象としない。

Scheduleの所属DAYは開始日とし、TimelineのカードはそのDAYだけに置く。Activeは日付境界だけで解除せず、翌日のText・Photo等は既存のActive優先に従って所属できる。actualStartAt / actualEndAt、createdAt / capturedAt、およびText・Photoの基本仕様は変更しない。

## 所属とChronology
Active Scheduleを日付境界より優先する。写真・Textが翌日でも継続中の前日Scheduleへ所属できる。Text時刻変更後はChronologyに応じて同じSchedule内または必要な所属先再評価を維持する。厳密な再所属アルゴリズムは未記載。

## B.3.3の限定復旧条件
以下すべてを満たす場合にACTIVE復旧：前日のSchedule／18時以降開始／終了時刻なし／明示完了・スキップなし／翌朝6時前／該当Scheduleが1件のみ。条件を拡張して複数候補から勝手に選ばない。参照する具体的な保存フィールドは原本だけでは確定しない。

## Candidate分離
B.1.1で古いslot-level timeNoteによる候補情報混線を修正。吐竜の滝Candidate「自然散策」と美術館Candidate「美術館鑑賞」を混同しない。

## 未記載
Trip、Timeline、Block、NotificationEvent、MediaAssetの完全なフィールド定義、ID型、関連キー、削除・移行方式は未確定。
