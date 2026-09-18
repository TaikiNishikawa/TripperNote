# UI / UX

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

根拠節：Master Backlog v2.1／Notification Policy／Quick Record Bar／Free Canvas／現在まさにやっていること／今一番最初に対応する内容。

## 画面・見た目（確定方針）
Bottom Navigation：旅行 / 記録 / ホーム / スポット / マイページ。
Design North StarはRodeo系iOS UI。Warm ivory / cream背景、White surfaces、Charcoal / black文字、Muted deep greenアクセント、大きめ余白、柔らかい角丸、写真主体、Editorial typography。色コード・余白・角丸・フォントの具体値は未記載。

Homeは巨大Heroを使わず、現在の旅行／NOW／NEXT／Navigation／Weather／Recent Record優先。Trip DetailのHero画像は残す。CalendarはRodeo系、My PageはAirbnb Profile系の構造を参考とする。

## Quick Record Bar
Record画面下部固定：＋ / カメラ / 今のことを記録… / ↑。
カメラは既存Cameraへ、Textはその場で送信。＋は将来Photo/Video Import、Free Canvas、Map、その他Blockへ。
B.2.1のGuard：終了済み・開始前旅行ではCameraを起動せず、Textはread-only。＋は残す。

## Text時刻編集：次工程B.3.4（未実装）
現状は2026-09-17T00:56のような文字入力。ISO文字列の手入力からiOSらしい時刻入力UIへ変更する。可能ならBottom Sheetまたはdatetime-local/time picker風で、キーボード入力を使わない。具体方式は未決定。

選択可能範囲はcreatedAt−30分からcreatedAtまで、両端を含む。日付跨ぎを扱い、未来および30分より前は不可。例：2026/09/17 00:10作成なら2026/09/16 23:40〜2026/09/17 00:10。日付を意識させすぎない自然な操作を目指す。

createdAtを絶対に変更せず、timelineTimeのみ変更。変更後はChronologyに応じて同じSchedule内、必要なら所属先を再評価する設計を維持する。最初は現在Active Schedule内のTextを30分以内で動かす実機確認を行う。

現在の注意/エラーToastの表示時間を確認し、読み切れる程度へ延長する。4〜5秒は検討目安であり、確定値ではない。無関係なToast全体へ変更を広げない。

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
