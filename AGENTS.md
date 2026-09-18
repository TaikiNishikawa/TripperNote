# Tripper Note 作業ルール

## 根拠と開始時の確認
製品仕様の入口はdocs/MASTER_SPEC.md。作業前に関連分野の文書、DECISIONS.md、ROADMAP.mdを読む。初期文書群の製品仕様の根拠は添付開発引き継ぎのみ。引き継ぎの未記載事項を推測で埋めない。コードは現状確認に使えるが、それだけで新しい製品仕様を決定しない。

実際のrepository、branch、作業中の差分、既存の階層別指示を読み取り確認する。既存変更を上書き・破棄せず、仕様と実装の差異を報告する。現行mainやHEADを引き継ぎだけから推定しない。

実装前は必要範囲で次の順序を確認する。

1. docs/MASTER_SPEC.md
2. 関連Product / UI / Architecture / Data Spec（PRODUCT.md / UI_UX.md / ARCHITECTURE.md / DATA_MODEL.md）
3. docs/REGRESSION_GUARDS.md
4. docs/IMPLEMENTATION_STATUS.md
5. docs/DECISIONS.md
6. docs/LEARNING_AND_COLLABORATION.md

工程・受け入れ条件はdocs/ROADMAP.mdも確認する。確定仕様・実装済み・実機確認済みを混同しない。

## 文書導入時の変更範囲
新規作成はdocs/MASTER_SPEC.md、PRODUCT.md、UI_UX.md、ARCHITECTURE.md、DATA_MODEL.md、ROADMAP.md、DECISIONS.md（すべてdocs内）とrootのAGENTS.mdのみ。同名ファイルがあれば上書きしない。既存コード・データ・Swift・Storyboard・Xcode設定を変更しない。build、sync、migration、依存更新、アプリ実行を文書導入のために行わない。

上記は初回Bootstrapの範囲。Founder依頼のMaster Spec v0.1 Review Fixでは、AGENTS.mdとdocs/**のみを変更範囲とし、IMPLEMENTATION_STATUS.md、REGRESSION_GUARDS.md、LEARNING_AND_COLLABORATION.mdの新規追加と既存文書の更新を認める。Bootstrapの既存内容を維持し、アプリVersion変更・B.3.4実装・commit・push・reset・restore・stash・cleanは行わない。

## Founderとの協働
Founderはユーザー本人であり最終意思決定者。AIは重要なProduct仕様・UX・Architectureを独断で確定・変更しない。AI Support PartnerはFounder直属の部下兼相棒であり、最終意思決定者ではない。詳細はdocs/LEARNING_AND_COLLABORATION.mdに従う。

原則は変更→確認→必要なら実機テスト→結果確認→次工程。UI/UXは可能な限り実機またはスクリーンショットで確認する。説明は必要に応じWhat（何をするか）、Why（なぜ必要か）、Founder Check（次に確認する1項目）を簡潔に示す。専門用語は必要に応じ初登場時に短く説明し、同じ説明を機械的に繰り返さず、大量の説明で作業を埋めない。

## 以後の実装で守ること
- 一度に1工程。最優先の次工程はROADMAPのv2.6.0-B.3.4候補。別途実装依頼があってからコードを変更する。
- 既存旅行、北杜旅行12 Photos、写真IndexedDB、既存V25を保護する。アプリ削除やデータ初期化を安易に指示しない。
- A.2の保存方式を守る。巨大V26 JSONやV25/V26二重保存でlocalStorage Quota問題を再発させない。
- PlaceResolverPlugin.swift、TripperBridgeViewController.swiftを重複追加しない。Target Membership、Main.storyboardのTripperBridgeViewController設定を触らない。依頼範囲外のNative/Xcode変更を行わない。
- B.1.1候補情報分離、B.2.1 Quick Record Guard、B.3 Snap、B.3.2 Core読戻し、B.3.3限定復旧と日跨ぎActive所属を維持する。
- Activeは日付境界より優先。手動操作は自動判定より優先。capturedAt / createdAtを勝手に変更しない。
- 予定外をエラー扱いせず、旅行を管理しすぎない。新規要件や大規模リファクタを混ぜない。
- 不明な仕様が作業に必要ならその点を確認し、独立して進められる作業は続ける。

## 検証・引き渡し
変更に応じた回帰確認を行い、静的確認・自動テスト・実機確認を区別する。実機で未確認なら実機確認済みと書かない。コード変更時はダウンロード可能なZIPを必ず用意する。引き継ぎの基本フローはCoding→ZIP→ユーザーがwww置換→npx cap sync ios→Xcode Run→スクリーンショット→1項目ずつ確認。www置換で必要ファイルを失わない成果物か確認する。

初心者向けに手順を一度に大量提示せず「まずここだけ確認してください」と1項目ずつ進める。終了時は変更ファイル、挙動、確認結果と未実施事項、仕様との差異、次の1確認を報告する。仕様変更提案はユーザーが採用するまで現行仕様と分けて記載する。
