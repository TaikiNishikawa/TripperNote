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

## Home Architecture + Calendar v1 + Range Selection（DECIDED）
根拠：2026-10-24のFounder確定仕様。以前のHome内Calendar案より本節を優先する。実装・確認状態は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)で分けて管理する。

Homeは現在の状態により優先表示を切り替える。

1. Active Scheduleあり：現在のScheduleを最優先する。
2. Active Scheduleなし・進行中Tripあり：現在のTripと次の予定を優先する。
3. 進行中Tripなし：「＋ 予定を立てる」、最近の完了済み／過去Tripを新しい順で最大3件、右上のCalendar入口を中心とするシンプルなHomeにする。過去Tripが0〜2件なら存在する件数だけ表示する。

作成CTAは既存Trip作成フローへつなぐ。過去TripはRecord Archive v2に従い、該当Tripの既存Timelineへ直接つなぐ。CalendarにはすべてのHome状態からアクセスできる。Home内に月間Calendarは置かず、独立したCalendar画面で既存Tripを日付から見つけ、新しい旅行期間を選べるようにする。

Calendarは一般的な7列月間表示とし、既存Tripの期間に含まれる全日付を未来・過去・月跨ぎ・年跨ぎに関係なく控えめに示す。日付タップで対応するTrip／DAYを表示し、同日に複数Tripがあれば選べる。Tripのない日には「この日から予定を立てる」を用意する。

今日以降の日付をなぞって連続する旅行期間を選択できる。指を離すと確定し、「＋ 作成」から既存Trip作成画面へ開始日・終了日を渡す。確定後は開始日または終了日の長押し・ドラッグで延長／短縮でき、端点は相手を追い越さず同日まで縮められる。解除・再選択も可能で、新しい未保存範囲は古い範囲を置き換える。過去日から未来Trip作成用Rangeを開始しない。

Calendar表示・Rangeは既存Tripからの計算とUI一時状態で扱う。範囲選択や作成画面を開く操作だけではTripを作らず、作成画面でユーザーが保存した時に既存作成処理を使う。既存Trip上のRange操作を日程変更として扱わない。Calendar用の永続データ、別系統のTrip、DB schema変更、migrationは追加しない。

### UI Hotfix（2026-10-26 Founder Decision）
Calendarの月間表示直下に開始日・終了日を常設し、範囲未選択でも表示する。各欄から年月日を独立した3列のドラムで選択する。確定・キャンセルを設け、確定前はRangeにもTripにも反映しない。既存の指ドラッグと端点長押しを維持し、ドラッグ後は日付欄、Picker確定後はRangeと表示月へ即反映する。今日より前・終了が開始より前の新規旅行範囲は拒否し、同日は1日旅行として許可する。月変更で存在しなくなる日だけはその月の末日へ調整する。＋作成は引き続き既存Trip作成画面へ両日付を渡し、明示保存前にTripを作らない。

過去のTripがある日をタップしたら、旅行名と「記録を見る」を画面内・下部タブバー上へ表示する。日付欄・詳細・safe-areaを確保し、小さい画面は日付グリッド側だけをスクロール可能にする。同日の複数Tripは選択可能とする。Trip日は控えめな背景と下線を併用し、今日・選択日・Rangeとは区別する。

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

### Cross-Day Schedule v1（DECIDED・一部実装）
日時FoundationのStep A／A.1はFounder最終承認・commit・push済み、Step BはEditor UIのみ実装済みとの報告。保存処理への接続（Step C）以降は未実装であり、今回のHome／Calendar工程にも含めない。実機未確認。詳細は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。

Founderの今回の決定により、開始日から翌日に終了する予定を1つのScheduleとして正式に扱う。初期対応の終了日は「当日」または「翌日」の2択で、翌日終了はユーザーが明示的に選択して確定する。終了時刻が開始時刻より早い場合、翌日扱いを提案してよいが、ユーザー操作なしに自動確定・保存しない。

開始と終了が同時刻で当日終了なら0時間のため保存不可。翌日終了なら24時間のScheduleとして許可する。日跨ぎScheduleは開始したDAYに所属し、翌日へ同じScheduleカードを複製しない。0時を跨いでも同一ScheduleのActiveを継続でき、日付境界だけでActiveを解除しない。翌日作成のText・Photo等がActive Scheduleへ所属できる既存仕様を維持する。

2日以上続くSchedule、旅行最終日を越えるSchedule、日付を跨いで遅れて開始する際の新ルール、翌日側の継続カード表示、新しい一般的なRecord再所属アルゴリズムはv1の対象外・未確定とする。

自動・簡易開始/終了時刻が対応する予定時刻の±15分以内ならactualをplannedへSnapする。境界の±15分を含む。手動編集したactualには適用しない。

重複がAまたはBの全時間の50%以上ならChoiceSlot（予定束）。例：13:00–14:00と13:30–14:30は30分重複で該当。初期selectedCandidateIdはnull。候補を自動確定せず、ユーザー選択時に正式Scheduleになる。移動時間は前Schedule→Candidate、Candidate→次Scheduleを候補ごとに動的計算する。

固定は予約・交通・イベント等でplanned時間を自動変更しない。調整可は初期開始±30分、滞在時間維持。二次設定は±15／±30／±60／カスタム。固定Schedule間をFlexible Blockとして扱う。

位置情報によるSchedule切替条件：

- 車：目的地200m以内、かつ10分連続滞在。
- 徒歩：目的地100m以内、かつ10分連続滞在。

到着候補時刻は10分経過時ではなく、最初に圏内へ入った時刻。同じ場所の連続ScheduleはGPS判定せず、次Schedule開始時刻に通知して切替を判断する。

## Record / Timeline
「Scheduleを骨格にして、その中に旅行記がリアルタイムで育つ」。Chronologyを壊さない。ScheduleにPhoto／Record／Text／Free Canvas／Map／その他が属し、Schedule間には寄り道（Unplanned Group）がある。

### Record Archive Redesign v2（2026-10-26 Founder Decision・DECIDED）
Recordタブの初期表示は過去Tripの一覧。1カードを1 Tripとし、新しい旅から並べる。カード全体をタップすると該当Tripの既存旅行記録・Timelineへ移動し、戻ると一覧へ復帰する。Schedule選択ページ、Gallery、スライドショー専用ページは作らない。旧Scheduleカード単位の構造は不採用とし、この決定を優先する。

カードは大きな横長写真、Trip名、旅行期間、写真総枚数、小さな矢印を表示する。Editorial Travel Archiveをコンセプトに、温かいオフホワイト、チャコール、深いグリーン、日本語のタイポグラフィと余白を使う。一覧にTrip切替チップ、大きなLIVE TIMELINE、撮影終了、START／FIN、大きなカウンター、Phase表示を置かない。進行中Tripがある場合のみコンパクトな入口を上部に置き、既存状態を日付だけで書き換えない。

Tripに確実に属する全写真を対象とし、Schedule未所属・寄り道・別Planの写真も含める。他Tripの写真を撮影日時の近さから混ぜない。重複を避け、2枚以上は3秒ごとにランダムなシャッフル順で再生する。1巡前に重複せず、巡回境界で直前と同じ写真が続かないようにする。1枚は静止、0枚はplaceholder、未ロードは読み込み中、読込不可は安全なfallbackとする。短いクロスフェードを使い、比率とカードサイズを保つ。2026-10-26のUI Hotfixで、写真全体を鮮明な前景として中央に表示し、同じ写真を拡大・ぼかした背景で左右の余白を埋める。保存画像のトリミングや品質変更は行わない。再生ボタンと巡回位置カウンターは不要。

画面外・タブ離脱・非表示では読み込みと再生を止め、表示時に再開する。既存Timeline・写真詳細・進行中TripのLive Timeline／Quick Recordを維持する。Home最近の旅とCalendarからは該当TripのTimelineへ直接進む。写真原本、capturedAt、actual、所属、Storageを変更しない。実装・自動確認・実機確認は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)で分ける。

TextはActive Scheduleがあれば自動所属し、日付境界よりActiveを優先する。createdAtは不変。timelineTime初期値はcreatedAtで、変更範囲はcreatedAtの30分前以上、createdAt以下。Canvasにはこの制限を適用しない。

Timelineへの写真・動画取り込みは信頼できるcapturedAtが必須。取得できないものはCanvas素材として使用可。手入力で撮影時刻を偽装してTimelineに入れない。

Grouping優先順は時刻→Schedule→場所。Scheduleありは予定時刻±60分候補。なしは時間差≤30分かつ距離≤300m。GPSなしは時間差≤15分。複数MediaのMergeには必ず確認画面を挟む。

## 未記載
対象ユーザーの詳細、収益化、共有、アカウント、完全な画面遷移は未確定。一般的な旅行アプリの機能から補わない。
