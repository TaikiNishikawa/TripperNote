# Decisions

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

根拠節：Product思想／各確定仕様節／Storage Architecture／実装履歴／今一番最初に対応する内容。
以下のIDは本書での参照用。DEC-001〜012は決定日が原本にないため不明とし、文書整理日を採用日にしない。実装・確認の詳細と制限は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。

2026-09-21追記：B.3.4に関する更新は、本タスクのFounder承認・実装／自動確認報告と今回のFounder実機報告を根拠とする。引き継ぎ時点の記録とは区別し、今回の反映日を過去の仕様採用日・実機実施日としない。

| ID | 状態 | 決定・保護事項 | 根拠・理由 |
|---|---|---|---|
| DEC-001 | 確定 | 事実は厳密、体験は柔らかく。手動優先、Undo・修正、予定外も正常。 | Product思想。 |
| DEC-002 | 確定 | 3 Travel Styleは共通データ、介入強度を変更。 | ゆったりでも自動切替し、操作負荷を抑える。 |
| DEC-003 | 確定・B.3確認 | planned/actual分離、±15分を含むSnap。手動編集actualは除外。 | 予定と事実を分ける。実機23:53→23:45確認。 |
| DEC-004 | 確定 | 50%以上重複で予定束、未選択null、自動確定なし。 | ユーザーが候補を選ぶ。移動は候補別計算。 |
| DEC-005 | 実装・A.2合格 | CoreはIndexedDB、localStorageは小さい互換・設定中心。 | A.1のV25/V26二重保存でQuotaExceededError。 |
| DEC-006 | 実装・B.1.1合格 | Candidate情報の分離を維持。 | slot-level timeNoteが別候補の内容を表示していた。 |
| DEC-007 | 実装・B.2.1合格 | 終了済み・開始前のCamera不可、Text read-only、＋維持。 | 過去旅行でもCameraが起動した問題。 |
| DEC-008 | 実装・検証経過あり | 起動時Core読戻しと限定Overnight復旧を維持。 | B.3.1で再起動後状態喪失、B.3.2修正、B.3.3日跨ぎ所属合格。引き継ぎ時点で未完だった再起動保持は、B.3.4のText時刻・同じActive所属について確認報告あり。全復旧ケースの合格へ広げない。 |
| DEC-009 | 確定・B.3.3確認 | 日付よりActive Schedule優先。 | 翌日写真/Textを前日継続中Scheduleへ所属。 |
| DEC-010 | 確定 | Text createdAt不変、timelineTimeはcreatedAt−30分〜createdAt。Canvasは適用外。 | 事実時刻を守り、記録時刻を調整可能にする。 |
| DEC-011 | 確定・将来方針 | Mediaには信頼できるcapturedAt必須、Mergeは確認。Original保持・非破壊trim。 | 時系列と原本を保護する。 |
| DEC-012 | DECIDED / IMPLEMENTED・実機は範囲限定CONFIRMED | B.3.4：専用Bottom Sheet、秒・ミリ秒を保持する30分候補、現在Active所属の限定維持、Text時刻編集の注意・エラーToastのみ4000ms。他Toastは1900ms維持。 | Founder承認に基づく実装。Picker・保存・Active所属・30分前候補・日跨ぎ・Cancel・再起動後保持は実機報告あり。Toast時間と内部精度は自動確認と実機確認を区別する。 |

## Documentation Review Fixで採用した協働方針
以下は今回のFounder依頼を根拠とする新規Decision。決定日は2026-09-18（今回の依頼日）であり、過去の採用日を推定したものではない。状態DECIDEDは方針採用を意味し、アプリ実装・実機確認を意味しない。

| ID | 状態 | 決定内容 | 理由・影響 |
|---|---|---|---|
| DEC-013 | DECIDED | ユーザー本人がTripper NoteのFounder兼最終意思決定者。 | Product・開発の意思決定責任を明確にする。 |
| DEC-014 | DECIDED | AIは重要なProduct仕様・UX・Architectureを独断で確定・変更しない。 | 提案と現行仕様を分け、Founderが採用した内容だけを反映する。 |
| DEC-015 | DECIDED | 原則、一度に1工程ずつ進める。 | 変更→確認→必要なら実機テスト→結果確認→次工程を守る。 |
| DEC-016 | DECIDED | UI/UXは可能な限り実機・Screenshotを確認しながら進める。 | 実際の見え方と操作を重視し、未確認は明記する。 |
| DEC-017 | DECIDED | AIは必要に応じ初心者向けの基礎解説を行う。 | Founderがアプリ開発・AI開発を学べるよう短く説明し、反復や大量説明を避ける。 |
| DEC-018 | DECIDED | AI運用・AIチーム設計ChatをAI Support Partner＝「Founder直属の部下兼相棒」とする。最終意思決定者ではない。 | 判断支援・AIチーム運用・指示設計・Spec管理・過剰変更防止・工程整理・初心者向け解説・専門AI間の整合性管理を担う。 |

関連文書：[LEARNING_AND_COLLABORATION.md](LEARNING_AND_COLLABORATION.md)、[MASTER_SPEC.md](MASTER_SPEC.md)、[AGENTS.md](../AGENTS.md)。実装・検証状態：協働ルールを文書化。アプリ変更・実機検証は今回の対象外。

## Cross-Day Schedule v1：Founder決定
根拠はFounder Decision。過去の開発引き継ぎから推定した仕様ではない。採用日は記録上未記載として扱い、文書反映日を採用日に読み替えない。以下の表は正式採用時の状態を残す。その後、Step A／A.1はFounder最終承認・commit・push済み、Step BはUIのみ実装済みと報告されている。保存処理への接続は未実装。実機確認済みとは扱わない。

| ID | 状態 | 決定内容 | 理由・影響 |
|---|---|---|---|
| DEC-019 | DECIDED / NOT IMPLEMENTED | 開始日から翌日に終了するScheduleを1つのScheduleとして正式にサポートする。初期対応は当日／翌日終了まで。 | Founderの正式採用。2日以上続く予定と旅行最終日を越える予定はv1対象外。 |
| DEC-020 | DECIDED / NOT IMPLEMENTED | 終了日は「当日／翌日」をユーザーが明示選択する。終了時刻が開始時刻より早い場合、翌日を提案してよいが、操作なしの自動確定・保存は禁止。 | Founderが翌日扱いを最終決定する。 |
| DEC-021 | DECIDED / NOT IMPLEMENTED | 開始・終了が同時刻なら、当日終了は0時間で保存不可、翌日終了は24時間として許可。 | Founderの同一時刻に関する決定。 |
| DEC-022 | DECIDED / NOT IMPLEMENTED | 日跨ぎScheduleは開始DAYに所属し、Timelineカードは開始DAYにのみ表示する。Activeは0時を跨いでも継続可能で、日付境界だけで解除しない。 | 既存のActive優先と翌日Text・Photo所属を維持。カードの翌日複製はしない。 |
| DEC-023 | DECIDED / NOT IMPLEMENTED | plannedStartAt / plannedEndAtを日付付きの完全なdatetimeで保持し、予定時間長を両datetimeの差から算出する。時刻だけでは日跨ぎを表現しない。 | 23:00→翌01:00を120分として扱う。既存フィールドを優先し、DB schema・保存構造・migrationは今回変更しない。 |

後続のFounder確定事項（Step A／A.1／B依頼・承認が根拠）：予定日時のSource of Truthは`slot.v21.plannedStartAt / plannedEndAt`、timezoneなしlocal datetime形式を維持し、Durationはcivil / wall-clock差とする。端末timezone・DSTで24時間のDurationやcalendar上の有効性を変えない。互換時刻との不一致を自動修復せず、表示中の時刻を編集初期値に保ち、明示保存時だけ同期する方針。同期保存は未接続。終了は任意、旅行最終日の翌日選択は不可、旅行を自動延長しない。Editorは当日／翌日の明示2択、カード表記の基本は「23:00 → 翌1:00」。実装はFoundationとEditor UIまで、カード変更・保存連携は含まない。詳細は[DATA_MODEL.md](DATA_MODEL.md)、[UI_UX.md](UI_UX.md)を参照する。

## Home Architecture + Calendar v1 + Range Selection：Founder決定
決定日：2026-10-24。根拠：Founderによる今回の一括実装依頼。以前のHome内Calendar案より本決定を優先する。DECIDEDは仕様採用を意味し、実機確認を意味しない。

| ID | 状態 | 決定内容 | 理由・影響 |
|---|---|---|---|
| DEC-024 | DECIDED | HomeはActive Schedule最優先、なければ進行中Tripと次の予定、進行中Tripがなければ作成CTA・過去Trip最大3件・Calendar入口を中心とする。 | 通常Homeをシンプルに保ち、旅行中は現在の行動を優先する。過去Tripは新しい順で既存記録／Timelineへつなぐ。 |
| DEC-025 | DECIDED | CalendarをHome右上から開く独立画面にする。すべてのHome状態からアクセスでき、Home内に月間Calendarを置かない。7列月間表示、月移動、今日、選択日、Trip期間全日のマーカー、日付別Trip／DAY詳細を備える。 | 既存Tripを未来・過去・月跨ぎ・年跨ぎの日付から辿れる。同日の複数Tripは選べるようにする。 |
| DEC-026 | DECIDED | 今日以降のRangeをなぞって選び、指を離して確定する。端点の長押し・ドラッグで延長／短縮でき、端点の追い越しは禁止、同日まで縮小可能。解除・再選択可能。 | タップとドラッグ、スクロール、pointercancelを区別する。月送りでも選択を維持し、自動月送り等の実装制約は報告する。 |
| DEC-027 | DECIDED | 確定Rangeの「＋ 作成」から既存Trip作成画面へ開始日・終了日を渡す。Tripのない日の作成入口も日付を引き継ぐ。画面内の保存までTripを作成しない。 | RangeはUI一時状態。既存Tripの日程変更やCalendar用永続データ追加を行わず、既存作成・保存方式を再利用する。 |
| DEC-028 | DECIDED | Home・Calendar・Range・作成連携を今回一括実装し、必要docsと自動テストを更新する。Cross-Day A／B、既存Trip・Timeline・写真を保護する。 | 小工程ごとの確認は不要。Cross-Day Step Cへの接続、DB schema・migration、データ初期化、不要なNative変更は含めない。stage・commit・push・tagはしない。 |

関連文書：[PRODUCT.md](PRODUCT.md)、[UI_UX.md](UI_UX.md)、[ROADMAP.md](ROADMAP.md)。実装・検証状態は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)に記録する。

## Record Inline Slideshow v1：過去の決定（v2で置換）
決定日：2026-10-25。根拠：Founder Correctionによる過去TripのRecord表示・遷移・カード内写真再生の確定指示。以下は履歴であり、2026-10-26のDEC-032〜035により置換された。現行仕様として適用しない。Home／Calendar／Range、既存Hotfix、Cross-Day Step A／Bは維持する。

| ID | 状態 | 決定内容 | 理由・影響 |
|---|---|---|---|
| DEC-029 | SUPERSEDED（DEC-032〜035） | 過去／完了済みTripを選ぶとRecord自体にScheduleカードを直接並べ、カード全体から既存Schedule記録／Timelineを開く。 | 別の選択・Gallery・Slideshow専用ページを挟まない。Trip名・日付・カードを優先し、無効なCamera／START・FINやdebug情報は隠すか抑える。進行中TripのLive Timeline・Quick Recordは維持する。 |
| DEC-030 | SUPERSEDED（DEC-032〜035） | 各Scheduleに保存済み明示リンクがある写真だけを大きなカード内領域に表示する。写真比率を維持し、Schedule名・最小限の予定日時は写真と分ける。 | 時刻からの推測、リンク補完・再所属はしない。ChoiceSlot候補ごとの重複を避け、未所属写真は既存Timelineで引き続き閲覧可能にする。 |
| DEC-031 | SUPERSEDED（DEC-032〜035） | 複数写真は約4秒ごとにランダム順で表示し、1巡前には繰り返さず、次の巡回で再シャッフルする。1枚は静止、0枚は控えめなplaceholder。 | 画面離脱で停止し、画面外カードの不要な処理を避ける。スクロール・タップを妨げず、再生状態はUI一時状態にする。データ・事実時刻・actual・DB schema・migrationは変更しない。 |

仕様は[PRODUCT.md](PRODUCT.md)、[UI_UX.md](UI_UX.md)、[DATA_MODEL.md](DATA_MODEL.md)、工程・検証状態は[ROADMAP.md](ROADMAP.md)、[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。仕様採用を実装・自動確認・実機確認の完了として扱わない。

## Record Archive Redesign v2：Founder Decision
決定日：2026-10-26。根拠：Founderの「Record Archive Redesign v2」確定指示。DEC-029〜031のSchedule単位の構造を不採用とし、以下を最新仕様とする。

| ID | 状態 | 決定内容 | 理由・影響 |
|---|---|---|---|
| DEC-032 | DECIDED | Recordタブ → 過去Trip一覧 → Tripカードから既存Trip Timeline → 戻ると一覧。1カード＝1 Trip、新しい旅から表示。 | Schedule選択・Gallery・Slideshow専用ページは作らない。Home／Calendarからの直接Timeline導線を維持する。 |
| DEC-033 | DECIDED | Editorial Travel Archive。大きな横長写真、Trip名・期間・写真枚数・小さな矢印。オフホワイト、チャコール、深いグリーン、余白と日本語の文字組み。 | 一覧から大きなLIVE／カウンター／撮影終了／START・FIN／Phase表示を整理。進行中Trip入口はコンパクトにし、実行操作と既存詳細機能は詳細に維持する。 |
| DEC-034 | DECIDED | Trip所属の全写真を3秒ごとにカード内シャッフル再生。未所属・寄り道写真も含め、別Tripを時刻で推定混入しない。 | 一巡内重複と巡回境界の連続同一画像を防ぐ。0枚・1枚・未ロード・読込不可を区別し、短いクロスフェードと固定寸法で表示する。 |
| DEC-035 | DECIDED | 画面外・離脱・非表示では停止し、可視時に再開。既存Trip状態・データ・写真原本・capturedAt・actualを変更しない。 | Home／CalendarのHotfixを実態監査し、Cross-Day A／B・Timeline・Quick Record・IndexedDBを保護。DB schema・migration・初期化を禁止。実装と自動確認まで一括で進め、実機未確認をCONFIRMEDにしない。commit／push／tagは行わない。 |

## UI Hotfix + GitHub Checkpoint（2026-10-26）
根拠：FounderのiPhone実機確認と本工程の明示指示。前工程までのcommit／push禁止は本工程の関連Checkpointに限って解除される。DB／migration／初期化／force pushの禁止とCross-Day Step C未接続は維持する。

| ID | 状態 | 決定内容 | 理由・影響 |
|---|---|---|---|
| DEC-036 | DECIDED | Recordカードは固定寸法・鮮明な全体表示の前景と、同一写真の拡大ぼかし背景を組み合わせる。 | 実機で目立った縦写真左右の無地余白を改善。3秒再生・fade・画面外停止を維持し、元画像・capturedAtを変更しない。 |
| DEC-037 | DECIDED | Calendarの開始日／終了日欄を常設し、独立3列の年月日ドラムで確定・Cancelする。 | 月・年をまたぐ変更を容易にする。既存ドラッグと同期、過去日／逆転拒否、同日許可、明示Trip保存前は非保存。 |
| DEC-038 | DECIDED | 過去日のTrip名と記録ボタンをスクロール不要で下部タブバー上へ表示。Trip日は背景＋下線で識別する。 | 日付欄と重ならず、safe-area・6週・複数Tripを扱う。必要時は日付グリッドだけをスクロールする。 |
| DEC-039 | DECIDED | 3修正と関連未commitのHome／Calendar／Record／Cross-Day B・tests・docsを1 Checkpointにしてcommit・pushする。 | messageは`feat: checkpoint Home Calendar Record UI refresh`。fetchして分岐があれば安全停止。秘密情報・ZIP・生成物は含めず、テスト成功と差分レビュー後のみ実行。 |

実機証拠：既存Calendarの長押しドラッグによる週跨ぎ変更はFounder報告によりCONFIRMED。写真余白と過去Trip導線の問題は実機での発見として記録し、新修正の実機合格とは扱わない。

## 未決定
未記載のDB詳細、将来機能の詳細。Cross-Day Schedule v1はDEC-019〜023の範囲で正式採用し、日時FoundationとEditor UIのみ実装済み。2日以上続く予定、旅行最終日を越える予定、日付を跨いで遅れて開始する新ルール、翌日側の継続カード表示、新しい一般的なRecord再所属アルゴリズムは未確定・v1対象外。B.3.4のPicker方式と局所的なToast時間はDEC-012のとおり採用・実装済みだが、未確認項目を実機合格へ格上げしない。

## 今後の追記形式
ID／状態（提案・採用・撤回等）／決定日（不明なら不明）／現行仕様／変更内容／理由／影響／根拠となるユーザー決定／関連文書／実装・検証状態を記録する。ユーザーの採用前に提案で現行仕様を上書きしない。
