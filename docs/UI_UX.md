# UI / UX

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

根拠節：Master Backlog v2.1／Notification Policy／Quick Record Bar／Free Canvas／現在まさにやっていること／今一番最初に対応する内容。

## 画面・見た目（確定方針）
Bottom Navigation：旅行 / 記録 / ホーム / スポット / マイページ。
Design North StarはRodeo系iOS UI。Warm ivory / cream背景、White surfaces、Charcoal / black文字、Muted deep greenアクセント、大きめ余白、柔らかい角丸、写真主体、Editorial typography。色コード・余白・角丸・フォントの具体値は未記載。

Homeは巨大Heroを使わず、現在の旅行／NOW／NEXT／Navigation／Weather／Recent Record優先。Trip DetailのHero画像は残す。CalendarはRodeo系、My PageはAirbnb Profile系の構造を参考とする。

## Cross-Day Schedule入力・表示（DECIDED・未実装）
Scheduleの終了日は初期対応で「当日／翌日」から選ぶ。翌日終了はユーザーが明示的に選択・確定する。終了時刻が開始時刻より前なら「翌日1:00として設定しますか？」のように提案してよいが、自動で翌日に確定・保存しない。具体的な操作部品や文言は未確定。

日跨ぎScheduleカードは開始DAYに1枚だけ表示し、翌日側へ複製しない。終了が翌日であることを区別できる表示とする。例えば「23:00 → 翌1:00」は表示案であり、具体的な表記は未決定。Active中に翌日作成されたText・Photo等は、既存のActive優先仕様に従い同じScheduleへ所属できる。翌日側の継続カード表示はv1対象外。

## Quick Record Bar
Record画面下部固定：＋ / カメラ / 今のことを記録… / ↑。
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
