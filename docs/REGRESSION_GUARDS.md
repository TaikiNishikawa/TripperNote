# Regression Guards

恒久的なSafety Guard。regression（変更によって既存の動作が壊れること）を防ぐため、今後の実装・レビューで必要範囲を確認する。根拠は開発引き継ぎを整理した既存SpecとFounderのMaster Spec v0.1 Review Fix依頼。意思決定の方針は[LEARNING_AND_COLLABORATION.md](LEARNING_AND_COLLABORATION.md)、確認実績は[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)を参照する。

## 旅行データと保存
- 既存旅行データ、北杜・小淵沢旅行、既存12 Photos、既存V25を保護する。修正のために消失・初期化させない。
- アプリ削除やストレージ初期化を安易に指示しない。復旧・検証のために既存写真を削除しない。
- 写真IndexedDBとTripper Note CoreのIndexedDBを壊さない。保存内容・関連付けを保護する。IndexedDBはアプリ内データを保存するデータベース。
- A.2の保存方式を維持する。localStorage（小さい互換データ・設定等の保存先）へ巨大V26 JSONを戻さず、V25/V26二重保存でQuotaExceededError（保存容量超過）を再発させない。
- B.3.2の起動時Core読戻しと、互換データcompact化でactive / actualStartAt / actualEndAtを失わない修正を維持する。

## Native / Xcode
- Swift Nativeファイルを重複追加しない。PlaceResolverPlugin.swiftとTripperBridgeViewController.swiftは既存追加済みとして扱う。
- 両ファイルを不用意に変更しない。依頼範囲外のNative / Xcode変更を行わない。
- Target Membership = Appを触らない。Main.storyboardのcustom class = TripperBridgeViewControllerを変更しない。

## 機能・時刻・所属
- B.1.1 Candidate Bundle Projection Hotfixを維持する。古いslot-level timeNoteで候補情報を混線させない。
- B.2.1 Quick Record Guardを維持する。終了済み・開始前旅行ではCamera不可、Text read-only、＋は維持。
- B.3のplanned/actual分離と±15分Snap Ruleを維持する。±15分の境界を含め、ユーザーが手動編集したactualには適用しない。
- Active Scheduleを日付境界より優先し、Cross-day Active Schedule Assignmentを維持する。翌日の写真・Textも継続中の前日Active Scheduleに所属できる。
- B.3.3限定復旧は[DATA_MODEL.md](DATA_MODEL.md)の全条件を守る。前日・18時以降開始・終了なし・明示完了/スキップなし・翌朝6時前・候補1件の範囲を勝手に拡張しない。
- createdAt / capturedAtなどの事実情報を勝手に変更しない。TextはtimelineTimeのみcreatedAt−30分〜createdAtの範囲で変更する。両端を含み、日跨ぎでも同じ条件。CanvasにTextの制限を流用しない。
- ユーザー手動操作を自動判定より優先する。予定外の行動をエラー扱いせず、寄り道も正常な旅行記として扱う。

## 検証と引き渡し
- 静的確認、自動テスト、実機確認を区別する。実機未確認を「実機確認済み」としない。一部の合格を版全体へ広げない。
- 変更範囲に応じて既存データ、保存・読戻し、Candidate分離、Quick Record、Snap、日跨ぎ所属の回帰確認を選び、未実施は明記する。
- 作業前からの変更を上書き・破棄しない。文書更新だけの工程でbuild、sync、migration、アプリ実行を行わない。
- コード変更時は必要ファイルが揃ったwww置換用ZIPを用意し、Founderが1項目ずつ確認する。文書のみのReview FixはアプリVersionを変更しない。
