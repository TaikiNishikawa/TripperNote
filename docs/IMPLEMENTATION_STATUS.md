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
| Cross-Day Schedule v1 / Step A・A.1 datetime Foundation | IMPLEMENTED：Founder最終承認・commit・push済み（`fe1d4a7`）。 | UNKNOWN：実機未確認。 | planned生成・civil / wall-clock時間差・timezone非依存validationとproduction helperのテスト。保存処理・UIへの接続を含まない。 |
| Cross-Day Schedule v1 / Step B Editor UI | IMPLEMENTEDとの報告：当日／翌日、preview、suggestion、最終日制御。 | UNKNOWN：実機未確認。 | 既存差分を保護し今回のUI Checkpointへ含める。UI一時状態のみで保存未接続。Step C以降と完成宣言を含まない。 |
| Home Architecture + Calendar v1 + Range Selection | IMPLEMENTED：2026-10-24のFounder確定仕様に基づく実装。 | CONFIRMED（限定）：2026-10-26 Founder報告の長押しドラッグによる週跨ぎ変更。その他はUNKNOWN。 | Home 3状態・独立Calendar・Range／端点編集・既存Trip作成／明示保存へ接続。下記の制約と自動確認範囲を参照。 |
| Record Archive Redesign v2 | IMPLEMENTED：2026-10-26 Founder Decisionに基づく実装・自動確認。旧Scheduleカードv1を置換。 | UNKNOWN：iPhone実機未確認。 | Record初期Trip一覧・3秒写真再生・既存Timelineと戻る。Home／Calendar直接導線、Live／Quick Recordを維持。下記の検証範囲を参照。 |

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

## Home / Calendar工程の記録（2026-10-24）
根拠：Founderの最新確定仕様と一括実装依頼。以前のHome内Calendar案より独立Calendarを優先する。実装範囲はHomeの3状態、Calendarの日付別Trip表示、UI一時Rangeと端点編集、既存Trip作成画面への両日付引き継ぎ。実装済み・自動確認済みであり、iPhone実機未確認をCONFIRMEDにしない。

実装：`www/js/calendar.js`はUI専用moduleであり、既存Tripから期間を読み取る。Home専用の状態解決を追加し、Camera／Quick Recordが参照する既存Home Trip判定は変更しない。Trip作成は既存フローへ初期日付を渡し、保存pipelineは再利用する。Range・端点選択はUIの一時状態で、Calendar用DB・schema・migrationは追加しない。

制約：自動月送りは行わず、通常の月送りでRangeを保持する。端点選択ボタンでも月跨ぎの修正ができる。既存Trip作成処理の370日上限を超える引き継ぎは拒否し、日程を黙って切り詰めない。この上限は既存実装の制約で、新規Product仕様とは分ける。未来日付セルではRangeドラッグを優先し、縦スクロールは周辺領域で行う。Safari／WKWebViewの実タッチ・長押し・誤タップ・safe-area・スクロールの確認を残す。


今回の自動確認（2026-10-24、架空データのみ）：

- `tests/home-calendar.test.cjs`：35/35成功をAsia/Tokyo・America/New_York・Europe/Londonで確認（計105実行）。production module・既存helperを実行し、Home優先順位、最近Trip 0／1／3／4件、calendar/DST境界、期間マーカー、Rangeと端点の比較、入力不変をassertする。
- `tests/home-calendar-ui.test.cjs`：隔離Chrome・Asia/Tokyoで26/26成功。実際のHTMLと全production scriptを読み、CTA、日付別Trip／DAY・Timeline、重複Trip、Rangeのライブ表示・長押し・短縮・解除・再選択・月送り、mouse/touch/pointercancel、周辺の縦スクロール、両日付の引き継ぎ、Cancel非保存、明示Save後のTrip追加とマーカー更新を確認した。素早い未来日→過去日タップ、今日DAYと翌日のNEXTの分離、Active ScheduleのPlanへの明示遷移も含む。
- `tests/cross-day-schedule.test.cjs`：既存31/31成功を同3 timezoneで再確認（計93実行）。Step Bの復元・提案・終了空欄・最終日・Cancelと非保存は上記browser suiteに含む。
- Calendar表示・Range・作成画面を開く／Cancelの各操作前後でAPP_DATA、localStorage、IndexedDB Coreを比較。明示Saveでは既存Trip・記録を維持し、新規Tripだけが追加されることを確認。実ユーザーデータ、写真Blob、iPhone内データはテストに使用していない。
- syntax check、`git diff --check`、diffレビューを実施。Step Aファイルと未commit Step Bのhelper／有効Editor／listener／HTML／CSSを照合して保護を確認。保存方式、Storage schema、migration、Nativeに変更なし。
- 320px・390pxのChrome表示を確認。7列・横溢れなし・作成ボタンがdock上に配置されることを確認し、Home 3状態とCalendarのスクリーンショットを目視した。Playwright未導入の環境ではbrowser suiteはskipとなるため、Playwrightを用意して別途実行する。

残る実機確認はSafari／WKWebViewの指ドラッグ・端点長押し・周辺スクロールの感触、safe-areaとnative date picker、および作成日付の引き継ぎ。Camera撮影・実写真Blob・実機再起動の全面回帰を今回確認済みとはしない。Cross-Day Step Cの保存連携は引き続き未接続。

Cross-Day保護の根拠は、この依頼前のFounder承認・実装／レビュー報告。Step A／A.1は3 timezone各31/31成功との報告、Step Bは3 timezone各20/20のUI操作検証と、read-onlyレビュー時の補足検証各17/17成功との報告がある。これらの過去結果を今回の再実行や実機合格とは扱わない。

## Record Archive Redesign v2工程（2026-10-26）
根拠：Founderの最新確定指示。旧Record Inline Slideshow v1のScheduleカードは不採用となり、Recordタブの初期表示を過去Trip一覧へ置換した。v1の過去確認結果（unit 24／browser 15等）は旧仕様の記録であり、現行v2の合格を意味しない。今回の現行結果は以下。

実装：`recordArchive.js`を最後に有効なRecord renderer／Trip選択／画面切替へ接続。Recordタブは毎回Trip一覧、明示Trip遷移は既存Timeline、戻ると一覧位置・フォーカスを復元。新しいページは追加しない。オフホワイト、チャコール、グリーン、大きな16:10写真、写真下のTrip名・期間・総枚数へ整理した。一覧に大きなLIVE・START／FIN・Phase・chip類を置かない。既存Timelineの写真編集・＋入口、進行中TripのLive／Quick Recordは維持する。

現行データには独立したTrip完了フラグがない。終了日が今日より前のTripを一覧へ出し、保存済みActive／Extendedまたは未終了actualがあれば日付より優先してLiveへ残す。この判定は読取のみで、TripやScheduleの状態を更新しない。日付範囲が現在のTripも既存判定に従いコンパクトな入口を表示する。

写真は`trip.records`の所属を根拠に集約し、明示tripIdが他Tripを指すものを除外する。Schedule未所属・寄り道・非active Planも含め、時刻や場所で補完しない。mediaKey／ID等を重複除去し、動画・Textを除外する。metadata未ロードと0枚を区別し、原本のreadonly取得→保存済みpreview→表示不可placeholderの順に扱う。写真原本・所属・capturedAt・actualは変更しない。

再生はカードごとのシャッフルqueueと3秒の次回時刻を持ち、全カードを1つのschedulerで動かす。1巡内重複なし、次巡回の先頭と前巡回の末尾の重複なし。2画像layerの260msクロスフェード、可視カード最大2 Object URLを上限とし、画面外・離脱・非表示でURLを解放して遅延読込結果を破棄する。画像ロードに時間がかかる場合は表示完了から次の3秒を数える。静止画像とTimeline画像には巡回timerを設けない。

自動確認（隔離Chrome・生成Trip／SVG写真のみ。実ユーザーデータと北杜・小淵沢12枚には未アクセス）：

- `tests/record-inline.test.cjs`はファイル名を継続し、内容をv2のproduction helper検証へ更新。24/24成功。Trip写真集合・別Trip除外・旧形式・重複・0／1／複数・Active優先・shuffle・入力不変・Storage未アクセス。
- `tests/record-inline-ui.test.cjs`はv2の全production HTML／scriptを使う19/19成功。Trip一覧／新しい順／空表示／ロード中、写真分離・原本／preview fallback、3秒巡回・連続重複防止、複数カード・画面外／離脱／background停止、遅延ロード破棄・URL解放、Timeline／戻る／写真詳細Cancel、Live／Quick Record、touch／keyboard、320px表示を確認。
- Home／Calendar unit 35件＋Cross-Day Step A 31件＋Record unit 24件をAsia/Tokyo・America/New_York・Europe/Londonで実行。各90/90成功、計270実行。
- Home／Calendar browserは既存26件に過去Trip DAYへの直接Timeline遷移・週跨ぎtouchを追加した28件。Record browser 19件と合わせ47/47成功。Calendar週跨ぎは10/31→11/1の正逆方向と端点長押し延長を実際のpointer経路で確認。現行calendar.jsは変更せず、v2のRecord遷移によって過去記録へ正しく着地することを確認した。Safari／WKWebViewの実機合格とはしない。
- APP_DATA、localStorage、IndexedDB Core、生成写真Blobのsnapshotを閲覧・切替・遷移前後で比較。coreV21／v21欠損を閲覧時に自動初期化しない。写真詳細を開いてCancelしてもデータ不変。
- syntax check、`git diff --check`、差分レビュー、320px／390pxのスクリーンショット目視。Home／Calendar本体、app.jsのCross-Day Step Bと保存関数、Step A helper／testを保護。Storage／schema／migration／Native変更なし。stage・commit・push・tagなし。

v2初回実装時の制約（後述Hotfix前）：iPhoneの実写真比率・3秒切替・短いfade・スクロール／tap／safe-area・background復帰は未確認。写真は表示比率を維持するため縦長写真に余白が出る。現在の端末日付と既存Active状態による一覧判定を用い、完了状態を新規保存しない。Calendar自動月送りは既存の未対応のまま。Camera実撮影・実機再起動・北杜12枚の端末上確認は未実施で、CONFIRMEDにはしない。

## UI Hotfix + Checkpoint（2026-10-26）
Founder実機結果：既存Calendarの長押し・週跨ぎ変更はCONFIRMED（限定）。Record縦写真の左右余白と、過去Tripの記録ボタンが画面下へ隠れる問題の報告を受領。今回の新修正の実機StatusはUNKNOWN。

実装：Recordは固定16:10領域の鮮明な前景と同一URLを使う拡大・18px blur背景を合成する。保存画像は加工しない。3秒シャッフル・260ms fade・最大2 Object URL／可視カード・停止／解放を維持する。Calendarは年月日3列のnative scroll＋snapによる軽量なカスタムPickerを追加。44px刻みの中央行を読み取り、年列は前後10年程度の窓を移動してDOMを小さく保つ（暦のYYYY範囲まで拡張可能）。文字入力はなく、確定前はUI draftだけを変更する。

Calendarは表示領域内で日付グリッドを可変高さにし、常設日付欄・選択日のTrip詳細・作成ボタンを下部dock上へ確保する。短い画面ではブランドヘッダーを省略し、グリッドをスクロール可能にする。複数Tripの詳細は横スクロールで選ぶ。Trip日マーカーは背景＋下線とし、Rangeと今日／選択日の輪郭を維持する。

自動確認は隔離ブラウザと生成Trip／SVG写真だけを使用。Calendar civil helper 40件、Record helper 24件、既存Cross-Day Step A 31件の計95件。BrowserはHome／Calendar 35件、Record 20件の計55件。縦横写真・0／1／複数・3秒切替・背景URL同期／解放、日付ドラムのtouch／keyboard／Cancel／非保存、年跨ぎ／月末／うるう年／逆転・過去拒否、ドラッグ同期、既存Trip作成への引き継ぎ、6週／複数Trip／320px・390px／safe-area相当の余白を確認する。Asia/Tokyo・America/New_York・Europe/Londonのunitは各95/95成功（計285実行）、隔離Chromeのbrowserは55/55成功。syntax checkとgit diff --checkも成功。データsnapshot・Cross-Day Bの復元／提案／Cancelの回帰も成功した。

残る実機確認：新しい3列ドラムの慣性と確定、縦写真のぼかし背景、6週の過去日→記録ボタンの配置と実safe-area。iPhone Safari／WKWebViewでの新修正、実写真・Camera実撮影・実機再起動は今回の自動テストでCONFIRMEDにしない。小画面の未来セルでは既存Rangeドラッグを優先し、グリッドのスクロールは左右余白または過去セルから行う。既存Trip作成の370日制限・Calendar自動月送り未対応は維持する。

Checkpoint対象は関連ソース・tests・docsのみ。ZIP・生成画像・秘密情報はGitに含めず、DB schema／migration／初期化／Native変更とCross-Day Step C保存連携は行わない。

## Timeline Photo Full-Frame UI Fix（2026-10-27）
状態：IMPLEMENTED・自動確認済み／CONFIRMED（本Fix）。2026-10-27、FounderからTimeline Photo Full-Frame UI FixのiPhone実機確認完了とGitHub保存承認を受領した。根拠はFounderの完了報告であり、AIが実機を再検証した意味ではない。個別端末・写真・操作ごとの結果は報告されていないため、無関係な機能や回帰項目全体の実機合格へ広げない。修正開始時は`feature/design-refresh`、HEAD `84cd26e`、working tree clean。

原因：有効な共通componentは`b1RecordMediaHtml`の`.b1-timeline-photo`。親の`aspect-ratio:16/10`と`overflow:hidden`が残り、過去Tripの画像だけを`height:auto`にしても親枠で切られていた。進行中Tripには画像の`height:100%`／`object-fit:cover`も適用されていた。古い未使用rendererだけの修正ではなく、両Timelineが使うcomponentを確認した。

修正：親の固定比率・切り取りを除去し、画像を幅100%・高さauto・contain・EXIF尊重へ統一。極端な縦写真は全体を収めて表示高さを制限する。`b1RememberTimelinePhotoSize`が実際にデコードされた寸法をDOM内へ保持し、Archiveの画面外解放・再表示時の高さを維持する。保存データと画像読み込み方式は変更しない。`index.html`はCSS／app.jsのcache識別子だけを更新した。

検証（実ユーザーデータ不使用）：

- `tests/record-inline-ui.test.cjs`に8件追加し28/28成功。過去／進行中の縦・横・正方形・複数写真、START／TIME DIARY、既存操作、極端な縦写真、画面外の解放／再読込、遅延／失敗／inline画像、EXIF orientation 6の生成JPEG、320px／390pxとsafe-area相当34pxでの最終操作ボタンをassert。
- Home／Calendar／Cross-Day B browser 35/35と合わせ、隔離Chromeで63/63成功。Record一覧の固定寸法・3秒・blur・fade・停止、Live／Quick Record、Home／Calendar／Range、Step Bの復元・提案・Cancelを回帰確認した。
- Cross-Day A 31件・Home／Calendar 40件・Record 24件はAsia/Tokyo・America/New_York・Europe/Londonで各95/95成功、計285実行。
- 全JS／CJS syntax check、git diff --check、差分レビュー成功。生成写真のBlob、APP_DATA、localStorage、IndexedDB Coreの操作前後snapshotを比較した。北杜・小淵沢12枚や実ユーザーのDBにはアクセスしていない。
- 生成画像の上端・下端を識別できるブラウザ表示を目視。元画像・時刻・所属、Storage／schema／migration／Native、Cross-Day A／B保存処理、Calendar、Record再生moduleは変更なし。

実装上の制約：画像寸法が未知の初回表示には高さ変化があり得る。極端な縦写真は全体を収めるため表示幅が小さくなる。新しい拡大ビューアや画像編集は追加していない。Founderの実機確認完了により、関連8ファイルのみを`fix: display full photos in trip timeline`でcommitし、`origin/feature/design-refresh`へ通常pushすることが承認された。既存データは操作せず、リモート分岐時は停止する。

## 更新ルール / SPEC GAP
- 新しい実装・実機結果は対象版、確認項目、結果、根拠、残課題を記録する。日付が不明なら不明のままにする。
- 原本再照合、Baselineの個別テスト記録は未完。再起動保持はB.3.4のText時刻・同じActive所属についてのみ上記のとおり確認済み。
- Cross-Day Schedule v1はDECIDED。日時FoundationとEditor UIのみIMPLEMENTED、保存連携以降は未実装、実機StatusはUNKNOWN。B.3.4で確認した限定的なActive所属維持を、Scheduleの翌日終了保存や実機合格として扱わない。実装上の懸念は[ROADMAP.md](ROADMAP.md)に記録する。
- 仕様と実装の差異は今回の監査・テスト範囲を明記し、コードから新しい製品仕様を補完しない。
