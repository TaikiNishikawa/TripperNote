# Product

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

根拠節：プロジェクト基本情報／Product思想／Master Backlog v2.1／Travel Style 3種／Schedule関連／Record関連。

## 目的・原則
旅行予定、旅行中の記録、写真・動画、寄り道、Canvasなどを一つのTimelineとして自然に残せるiPhone旅行アプリ。

1. Scheduleは旅を縛らず支える。
2. 自動化は裏側で働き、ユーザーに負担を感じさせない。
3. 予定外の行動をエラー扱いしない。寄り道も正式な旅行記の一部。
4. 自動判断は簡単にUndo・修正できる。
5. 旅行中は「撮る・書く・楽しむ」が中心。整理はTripper Noteが引き受ける。

## Travel Style（確定仕様）
Trip単位で「🌿 ゆったり」「⚖️ バランス」「⏱ しっかり」。初期値はバランス。データ構造は共通で、違いは介入強度。

| Style | 介入方針 |
|---|---|
| ゆったり | 自動で整える。判断が必要なときだけ呼ぶ。 |
| バランス | 自動で整える。知っておいた方がよい変化は適度に知らせる。 |
| しっかり | 自動で整える。問題になる前に先回りして知らせる。 |

ゆったりでも自動Schedule切替を使用する。操作頻度を減らす方針である。

## Schedule
plannedとactualは分離。実旅行上のActive Scheduleは原則1つ。ユーザー手動操作が最優先。

自動・簡易開始/終了時刻が対応する予定時刻の±15分以内ならactualをplannedへSnapする。境界の±15分を含む。手動編集したactualには適用しない。

重複がAまたはBの全時間の50%以上ならChoiceSlot（予定束）。例：13:00–14:00と13:30–14:30は30分重複で該当。初期selectedCandidateIdはnull。候補を自動確定せず、ユーザー選択時に正式Scheduleになる。移動時間は前Schedule→Candidate、Candidate→次Scheduleを候補ごとに動的計算する。

固定は予約・交通・イベント等でplanned時間を自動変更しない。調整可は初期開始±30分、滞在時間維持。二次設定は±15／±30／±60／カスタム。固定Schedule間をFlexible Blockとして扱う。

位置情報によるSchedule切替条件：

- 車：目的地200m以内、かつ10分連続滞在。
- 徒歩：目的地100m以内、かつ10分連続滞在。

到着候補時刻は10分経過時ではなく、最初に圏内へ入った時刻。同じ場所の連続ScheduleはGPS判定せず、次Schedule開始時刻に通知して切替を判断する。

## Record / Timeline
「Scheduleを骨格にして、その中に旅行記がリアルタイムで育つ」。Chronologyを壊さない。ScheduleにPhoto／Record／Text／Free Canvas／Map／その他が属し、Schedule間には寄り道（Unplanned Group）がある。

TextはActive Scheduleがあれば自動所属し、日付境界よりActiveを優先する。createdAtは不変。timelineTime初期値はcreatedAtで、変更範囲はcreatedAtの30分前以上、createdAt以下。Canvasにはこの制限を適用しない。

Timelineへの写真・動画取り込みは信頼できるcapturedAtが必須。取得できないものはCanvas素材として使用可。手入力で撮影時刻を偽装してTimelineに入れない。

Grouping優先順は時刻→Schedule→場所。Scheduleありは予定時刻±60分候補。なしは時間差≤30分かつ距離≤300m。GPSなしは時間差≤15分。複数MediaのMergeには必ず確認画面を挟む。

## 未記載
対象ユーザーの詳細、収益化、共有、アカウント、完全な画面遷移は未確定。一般的な旅行アプリの機能から補わない。
