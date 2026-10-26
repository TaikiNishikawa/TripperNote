# UI / UX

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

根拠節：Master Backlog v2.1／Notification Policy／Quick Record Bar／Free Canvas／現在まさにやっていること／今一番最初に対応する内容。

## 画面・見た目（確定方針）
Bottom Navigation：旅行 / 記録 / ホーム / スポット / マイページ。
Design North StarはRodeo系iOS UI。Warm ivory / cream背景、White surfaces、Charcoal / black文字、Muted deep greenアクセント、大きめ余白、柔らかい角丸、写真主体、Editorial typography。色コード・余白・角丸・フォントの具体値は未記載。

Homeは巨大Heroを使わず、以下のFounder確定仕様に従う。Trip DetailのHero画像は残す。My PageはAirbnb Profile系の構造を参考とする。

## Home / Calendar / Range Selection（2026-10-24 Founder決定）
以前のHome内Calendar案より本節を優先する。既存のWarm ivory・White surfaces・Muted deep green等のデザイントークンを尊重し、iPhone向けに余白のあるシンプルな画面とする。通常Homeを管理画面的な情報密度にしない。

Homeの優先順位はActive Schedule、進行中Trip、通常Homeの順。通常Homeは目立つ「＋ 予定を立てる」、最近の完了済み／過去Trip最大3件、右上のCalendarアイコンを中心にする。過去Tripは新しい順で、タップすると該当Tripの既存Timelineを直接開く。Active Schedule／進行中Tripの表示中もCalendarへアクセスできる。

CalendarはHome右上から開く独立画面とする。7列の月間Calendarに月・曜日・日付、前月／次月、今日へ戻る、今日・選択日の識別を備える。Trip期間全日のマーカーは控えめに表示する。日付タップで下部に該当Trip／DAYを表示し、予定・Timelineへ進める。同日の複数Tripは選択可能にする。Tripのない日は「この日から予定を立てる」で、その日付を既存作成フローへ引き継ぐ。

Range操作は以下とする。

- 今日以降をなぞる間、開始日〜終了日を帯状にリアルタイム表示し、指を離すと確定する。
- 確定後は右下の「＋ 作成」から既存Trip作成画面へ両日付を渡す。作成画面の保存前にはTripを作成しない。
- 確定した範囲の開始日／終了日を長押しし、そのままドラッグして延長・短縮できる。編集中の端点を視覚的に示し、相手端点を追い越さず同日まで縮小する。
- 選択解除・再選択を可能にする。過去の日付ではRangeを開始せず、既存Trip上の操作も既存Tripの日程編集にしない。
- 通常の日付タップとドラッグを区別し、iPhone Safari／WKWebViewの長押し、pointercancel、誤タップ、縦スクロールとの競合を扱う。月跨ぎでは通常の月送りでも選択を保持する。自動月送りを実装しない場合は制約として明記する。

ダミーボタンや空の遷移を作らない。既存の画面構造・navigation・Trip作成フローを再利用し、Calendar用の永続状態を増やさない。実装・ブラウザ確認・実機確認は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)で区別する。

### v1の操作上の制約と補助操作
月間表示には隣接月の日付も含める。Rangeは通常の月送りでも保持し、自動月送りは行わない。月間表示直下の常設開始日／終了日欄から、3列の年月日ドラムで月・年をまたぐ端点変更もできる。

未来日付のセル上ではRangeドラッグを扱い、画面の縦スクロールはCalendarの周辺で行う。端点の長押し後は対象端点を強調し、操作が`pointercancel`で中断した場合は操作前の選択へ戻す。2026-10-26のFounder報告により、長押しドラッグによる週跨ぎ変更はiPhone実機CONFIRMED。今回追加したPicker・小画面グリッドスクロール・詳細配置の実機結果はUNKNOWNとする。

### Calendar UI Hotfix：日付ドラムと画面内の詳細（2026-10-26）
開始日・終了日を月間表示直下に常設する。「未選択」からでも開ける3列のカスタムPickerをBottom Sheetで表示する。年・月・日は個別に縦スクロールし、中央行で選択する。テキスト入力やOS依存のDate Pickerは用いない。確定・キャンセル、キーボード矢印操作・Escape・focus制御を備える。選択途中はdraftだけを変え、確定でRange・日付欄・表示月を同期する。逆転日付と過去日は説明を表示して確定を無効にする。月末・うるう年の日数に応じて日列を更新する。

Calendarでは下部タブバーとsafe-areaの上に日付欄と選択日のTrip名・記録ボタンを常に確保する。6週の月も扱い、狭い高さでは日付グリッドだけを縦スクロールする。短い画面では上部ブランドを省略して日付の表示面積を確保する。未来セルは既存Rangeドラッグを優先するため、グリッドの縦スクロールは左右の余白や過去セルから操作する。複数Tripは横にスワイプできる詳細カードから選ぶ。選択範囲の＋作成は日付欄の下、詳細の上の右側に置き、重ならないようにする。

Trip日は淡い背景と短い下線。今日の輪郭、選択日の内側の輪郭、Rangeの帯・濃い端点とは異なる表示とする。Calendar全体のページスクロールは不要とし、HomeやRecordのスクロールは変更しない。

## Timeline Photo Full-Frame UI Fix（2026-10-27記録）
根拠：Founderの実機報告と今回の修正指示。過去Tripと進行中Tripで共用するTimeline写真カードは、写真の全体を表示する。Record一覧のTripスライドショーとは別の表示仕様とする。 2026-10-27にFounderから本FixのiPhone実機確認完了を受領した。確認範囲は本Fixに限定し、無関係な機能の実機確認へ広げない。

- 写真枠の固定16:10比率と切り取りを廃止し、カード内の幅・画像本来の比率から高さを決める。縦・横・正方形に対応し、画像を変形させない。
- 極端な縦写真のみ、画面高の85%と960pxの小さい方を表示上限とし、`contain`で写真全体を中央に収める。これは表示上の実装値で、原本への加工や新しい写真ビューアは追加しない。
- START／TIME DIARY、時刻、代表写真表示は上、場所・説明・編集／代表写真／削除は下に維持する。Schedule／DAY／ChoiceSlotの構造と時系列は変えず、カードが内容に応じて伸びる。
- デコード後の縦横比（EXIFの向きを含む）をDOMだけに保持し、画面外の画像URLを解放しても領域を潰さない。再読込によるスクロールのずれを抑え、既存の下部タブ・Quick Record Bar・safe-areaの余白を維持する。
- 寸法が未知の初回読込には仮領域を用い、読込後に自然な高さへ更新する。この初回の高さ変化を完全にゼロにするものではない。読込失敗時は既存のplaceholderと操作ボタンを維持する。

Record一覧は固定寸法・3秒シャッフル・クロスフェード・同一写真のぼかし背景・画面外停止を維持する。画像原本、画質、capturedAt、保存データは変更しない。自動確認とiPhone実機確認の区別は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。

## Cross-Day Schedule入力・表示（DECIDED・Step B UIのみ実装）
Step Bの当日／翌日選択・Editor内preview・suggestionは既存の未commit実装として保護する。保存処理との接続、カード表示変更は今回のHome／Calendar工程に含めない。実機確認済みとは扱わない。

Scheduleの終了日は時刻の近くの「当日／翌日」2択で明示選択する。終了時刻が開始時刻より前なら「翌日1:00として設定しますか？」相当の提案を表示し、「翌日にする」操作でUIを変更する。自動で翌日に確定・保存しない。新規は当日、既存はsaved planned datetimeの日付差で当日／翌日を復元し、時刻の大小だけでは判定しない。終了未入力では両選択を非活性にし、終了なしのpreviewにする。旅行最終日は翌日を選択不可とし、必要に応じ「旅行最終日を越える予定は現在未対応」と説明する。

Editor内previewは「23:00 → 翌1:00」のように翌日を識別できる表示とする。日跨ぎScheduleカードも同表記を基本とすることをFounderが採用済みだが、カード表示変更はStep Dであり未実装。カードは開始DAYに1枚だけ表示し、翌日側へ複製しない。Active中に翌日作成されたText・Photo等は、既存のActive優先仕様に従い同じScheduleへ所属できる。翌日側の継続カード表示はv1対象外。

## Record Archive Redesign v2（2026-10-26 Founder Decision）
Recordタブは過去Trip一覧を最初に表示する。ヘッダーは「RECORD」「旅の記憶。」「その日の景色を、もう一度。」。1 Tripにつき1枚の写真中心カードを縦に並べる。Trip切替チップ、LIVEの大カード、撮影終了、START／FIN、集計カウンターやPhase情報は一覧に置かない。進行中Tripへの入口はコンパクトに保つ。

温かいオフホワイトの地、チャコールの文字、深いグリーンのアクセントと上質な余白を使う。カードは16:10程度の固定写真領域、写真下のTrip名・旅行期間・写真総枚数・小さな矢印で構成する。写真は縦横比を保って中央に全体表示し、同じ写真を拡大・ぼかした背景を重ねて左右の無地の余白をなくす。前景にはぼかしを適用しない。横長カードの寸法と短いクロスフェードを保ち、文字は写真の下に配置して可読性を守る。過度なグラデーション、枠、情報密度は避ける。

Trip所属の全写真（Schedule未所属・寄り道も含む）をカードごとに独立再生する。2枚以上は3秒間隔のシャッフル、一巡後に再シャッフルし、直前と同じ写真の連続を防ぐ。短いクロスフェードでカードの寸法を変えない。1枚は静止、0枚はplaceholder。ロード中を0枚と見せず、原本読込失敗時は保存済みpreview、どちらも不可なら表示不可のplaceholderにする。再生ボタン、巡回位置カウンター、専用ページは追加しない。

カード全体から既存Trip Timelineを開き、戻る操作で一覧の位置と対象カードへ復帰する。Home／CalendarのTrip入口はTimelineへ直接つなぐ。詳細内の写真編集・閲覧・既存＋入口を維持し、一覧には実行操作を置かない。Live TimelineとQuick Recordは進行中Tripの詳細で維持する。下部タブバーとsafe-areaを保ち、スクロールがカードタップと誤認されないようにする。画面外・タブ離脱・非表示で再生を止め、復帰時は可視カードだけ再開する。iPhone実機の表示・3秒間隔・タッチ操作は未確認。

## Quick Record Bar
進行中TripのRecord詳細では画面下部固定：＋ / カメラ / 今のことを記録… / ↑。Archive一覧には置かず、過去Tripの詳細には既存＋入口と記録編集を残す。
カメラは既存Cameraへ、Textはその場で送信。＋は将来Photo/Video Import、Free Canvas、Map、その他Blockへ。
B.2.1のGuard：終了済み・開始前旅行ではCameraを起動せず、Textはread-only。＋は残す。

## Text時刻編集：B.3.4（IMPLEMENTED・実機は範囲限定CONFIRMED）
この節の更新根拠は、引き継ぎとは別に、本タスクのFounder承認・実装／自動確認報告と2026-09-21受領のFounder実機報告。ISO手入力を専用Bottom Sheet「表示時刻」へ置換した。候補をスクロールして選択し、保存／キャンセルする。Bottom Sheet表示・キーボード入力が出ないこと・時刻変更保存は実機CONFIRMED。

選択可能範囲はcreatedAt−30分からcreatedAtまで、両端を含む。日付跨ぎを扱い、未来および30分より前は不可。例：2026/09/17 00:10作成なら2026/09/16 23:40〜2026/09/17 00:10。日付を意識させすぎない自然な操作を目指す。

createdAtを絶対に変更せず、timelineTimeのみ変更する制約を維持。現在Active Scheduleに所属しているTextの時刻編集では既存所属を保持し、それ以外の既存再所属処理は変更しない。現在Active内の時刻変更、日跨ぎの「前日 HH:mm」表示・保存後の所属維持、Cancelで時刻・所属を変えないこと、完全終了／再起動後のtimelineTime・同じActive所属保持は実機CONFIRMED。これは上記Cross-Day Schedule v1の実装・実機確認を意味しない。

基本候補は作成時刻Cから`C - n × 60,000ms`（n=0〜30）で生成し、表示の分と内部timestampを分ける。秒・ミリ秒を切り捨てず、範囲内の既存timelineTimeが基本候補にない場合も「現在の設定」として保持する。ちょうど30分前の候補の選択・保存は実機CONFIRMEDだが、内部の秒・ミリ秒精度は自動確認のみであり、実機画面による直接確認ではない。

Text時刻編集の注意・エラーToastのみ4000ms、他Toastは既定1900msを維持する実装を採用済み。コードレビュー・自動確認済み。約4秒の実表示時間は安全に再現できる実機操作がないため未確認。他Toastの約1.9秒も今回改めて実機確認済みとはしない。項目別Statusは[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。

## 通知（確定仕様、実装予定）
| Style | レベル | 挙動 |
|---|---|---|
| ゆったり | P0 Silent / P1 Gentle / P2 Important | 自動切替成功や寄り道では通知しない。終了予定を30分超えたという事実だけでは通知しない。 |
| バランス | P0 Silent / P1 Info / P2 Action / P3 Important | 終了+30分にP1で1回確認。許容内Flexibleは自動調整。固定ScheduleリスクはP3。 |
| しっかり | P0 Silent / P1 Info / P2 Action / P3 Important / P4 Urgent | 出発前通知を予告→そろそろ出発→遅延リスクに段階化。 |

ゆったりの通知対象は同一場所Schedule、GPS判定不能、未選択ChoiceSlot、固定予約への影響など。「このまま楽しむ」でP1を60分抑制、P2は突破可能。P1は原則再通知なし、「あとで確認」のみ30分後再評価。P2は15分後最大1回。
しっかりのlatestDepartureAt = plannedStartAt − predictedTravelDuration − safetyBuffer。標準Safety Bufferはまず10分。未記載の通知間隔や閾値は追加しない。

## Free Canvas（確定仕様、後続工程）
Free Canvasは深い編集機能ではなく、Quick Record Barの＋から選べる一次機能。
v1素材：photo、subject cutout、transparent image、text、emoji/sticker。
操作：move、scale、rotate、bring forward、send backward、duplicate、delete。
image：flip、opacity、corner rounding。text：size、bold、alignment、color、background label。
比率：1:1、4:5、9:16、16:9。timelineTimeは作成時の現在Timeline帯、後から自由変更可能。Textの30分制限なし。
