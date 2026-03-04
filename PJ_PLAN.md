# Field People — PJ_PLAN.md（フェーズベース）

## 0. ヘッダ / メタ情報

- 作成日: 2026-03-05
- 最終更新日: 2026-03-05（実装着手反映）
- ドキュメントオーナー: PM（暫定）
- 対象要件: `REQUIREMENTS.md`（Draft）
- 計画期間: 10週間（設計2週 + 開発6週 + テスト2週）
- ステータス定義:
  - `Not Started`: 未着手
  - `In Progress`: 進行中
  - `Blocked`: 依存待ち/外部要因で停止
  - `Review`: レビュー中
  - `Done`: 完了
- 優先度定義:
  - `P0`: クリティカルパス上で遅延不可
  - `P1`: MVP成立に必須
  - `P2`: MVP後でも許容可能

---

## 1. プロジェクト概要

Field People のMVPを、`REQUIREMENTS.md` に基づいて段階的に実装・検証するためのプロジェクトシート。  
管理対象は、People / Contracts / Projects / Invoices / Matrix連携を中心とし、認証・監査ログ・通知を含む基盤を並行整備する。

チャット運用前提:

- 業務管理機能は Field People Web アプリで提供
- チャットクライアントは Element（Web版 / スマホ）利用を前提とし、Field People は Room 連携・権限同期・導線提供を担当

---

## 2. マイルストーン一覧（フェーズベース）

| Milestone ID | フェーズ | 期間目安 | 目的 | 完了条件 |
|---|---|---|---|---|
| M1 | 設計 | Week 1-2 | 要件/設計の確定と未確定事項の解消方針決定 | MVP対象機能の仕様確定、データモデル確定、RBAC/連携方式の意思決定記録が揃う |
| M2 | 開発 | Week 3-8 | MVP機能と基盤機能の実装完了 | People/Contracts/Projects/Invoices/Matrix連携が動作し、監査ログ・通知・認証を含む最低限のE2Eが通る |
| M3 | テスト | Week 9-10 | 結合・権限・業務フロー・非機能の最終確認 | 主要シナリオ試験完了、重大不具合クローズ、リリース判定可能な品質報告書完成 |

---

## 3. タスク一覧（milestone紐付け）

### 3.1 設計フェーズ（M1）

| Task ID | Milestone | Task | 担当ロール | 成果物 | 受け入れ条件 | 依存Task | 期限目安 | 優先度 | ステータス |
|---|---|---|---|---|---|---|---|---|---|
| T1-01 | M1 | 要件確定ワークショップ（MVP境界、対象ロール、業務フロー） | Admin / BackOffice / PM | 要件確定メモ、MVP境界定義 | MVP in/out が明文化され、関係者合意済み | - | W1 | P0 | Not Started |
| T1-02 | M1 | 論理データモデル確定（Person/Contract/Project/Invoice/Timesheet/Task/Room） | Backend | ERD/テーブル設計ドラフト | 全MVPエンティティの必須属性と関連が定義済み | T1-01 | W1 | P0 | In Progress |
| T1-03 | M1 | RBAC方式の決定（simple role only / role+permission） | Backend / Security | RBAC設計決定記録 | 4ロール（Admin/BackOffice/Member/Talent）の許可範囲がAPI/画面単位で記述済み | T1-01 | W1 | P0 | In Progress |
| T1-04 | M1 | Keycloakユーザー同期方式の決定（OIDC claims / SCIM / 定期同期） | Backend / Infra | 同期方式設計書 | 同期タイミング・失敗時リカバリ・監査方針が定義済み | T1-03 | W2 | P0 | Not Started |
| T1-05 | M1 | Matrix連携方式の決定（Synapse運用方式、Service Account方針） | Backend / Infra | Matrix連携設計書 | Room作成/退出/権限連動の仕様が確定 | T1-01 | W2 | P1 | In Progress |
| T1-06 | M1 | 通知基盤の決定（Go job / cron / queue+worker） | Backend / Infra | 通知基盤設計書 | 契約更新/請求提出/タスク期限通知の実行方式と再送方針が定義済み | T1-01 | W2 | P1 | Not Started |
| T1-07 | M1 | 請求入力テンプレ仕様確定（固定フォーム/カスタム項目） | BackOffice / Product | 請求入力仕様書 | 提出必須項目・バリデーション・承認状態遷移が確定 | T1-01 | W2 | P1 | Not Started |

### 3.2 開発フェーズ（M2）

| Task ID | Milestone | Task | 担当ロール | 成果物 | 受け入れ条件 | 依存Task | 期限目安 | 優先度 | ステータス |
|---|---|---|---|---|---|---|---|---|---|
| T2-01 | M2 | 認証連携実装（Keycloakログイン/招待/パスワードリセット導線） | Backend / Frontend | Auth連携機能 | ログイン成功、ロール情報取得、招待フロー疎通 | T1-03,T1-04 | W3 | P0 | In Progress |
| T2-02 | M2 | People管理実装（登録/検索/スキル・稼働検索） | Backend / Frontend | People API + 画面 | CRUDと検索がRBAC付きで動作、監査ログ記録 | T2-01,T1-02 | W3-W4 | P0 | In Progress |
| T2-03 | M2 | Contract管理実装（登録/更新通知/終了通知） | Backend / Frontend | Contract API + 画面 + 通知連携 | 30/14/7日前通知が設定通り生成される | T2-01,T1-02,T1-06 | W4-W5 | P0 | Not Started |
| T2-04 | M2 | Project管理実装（作成/メンバー追加/プロジェクト内ロール） | Backend / Frontend | Project API + 画面 | プロジェクト作成からメンバー割当まで完了 | T2-01,T1-02 | W4-W5 | P1 | Not Started |
| T2-05 | M2 | Task機能実装（最低限のタスク管理） | Backend / Frontend | Task API + UI | タスク作成/担当/期限/状態更新が可能 | T2-04 | W5 | P1 | Not Started |
| T2-06 | M2 | Timesheet実装（入力/承認） | Backend / Frontend | Timesheet API + UI | Talent入力と承認者承認がロール制御付きで動作 | T2-04 | W5-W6 | P1 | Not Started |
| T2-07 | M2 | Invoice実装（提出/承認/支払記録 + ファイルアップロード） | Backend / Frontend | Invoice API + UI + Storage連携 | draft/submitted/approved/paid 遷移、ファイル保存、監査ログ記録 | T1-07,T2-01 | W6-W7 | P0 | Not Started |
| T2-08 | M2 | Matrix Room連携実装（person/project/community） | Backend / Frontend | Room連携機能 | Room生成、関連付け、退出時アクセス除去が動作 | T1-05,T2-02,T2-04 | W6-W7 | P1 | Not Started |
| T2-09 | M2 | 監査ログ実装（主要更新操作の追跡） | Backend | Audit Log機能 | 重要操作で「誰が/いつ/何を」が追跡可能 | T2-02,T2-03,T2-07 | W7 | P0 | Not Started |
| T2-10 | M2 | 通知実装（Matrix/Email） | Backend | 通知ジョブ/配信機能 | 契約/請求/期限通知が遅延なく配信される | T1-06,T2-03,T2-05,T2-07 | W7-W8 | P1 | Not Started |
| T2-11 | M2 | ダッシュボード実装（契約更新/未提出請求/未承認請求/期限タスク） | Frontend / Backend | Dashboard UI/API | 4つの主要KPIカードがロール別表示で確認可能 | T2-03,T2-05,T2-07 | W8 | P1 | Not Started |

### 3.3 テストフェーズ（M3）

| Task ID | Milestone | Task | 担当ロール | 成果物 | 受け入れ条件 | 依存Task | 期限目安 | 優先度 | ステータス |
|---|---|---|---|---|---|---|---|---|---|
| T3-01 | M3 | 結合試験（機能横断） | QA / Backend / Frontend | 結合試験結果 | People-Contract-Project-Invoice-Roomの連携ケースが全件通過 | T2-01..T2-11 | W9 | P0 | Not Started |
| T3-02 | M3 | 権限試験（RBAC） | QA / Security | 権限試験結果 | 4ロールで許可/拒否が仕様通りである | T3-01 | W9 | P0 | Not Started |
| T3-03 | M3 | 業務フロー試験（登録/請求/契約終了） | QA / BackOffice | シナリオ試験結果 | 3つの主要UXフローがE2E完走 | T3-01 | W9 | P0 | Not Started |
| T3-04 | M3 | 性能確認（同時50ユーザー、応答<300ms） | QA / Infra | 性能測定レポート | 主要API/画面で性能目標を満たす | T3-01 | W10 | P1 | Not Started |
| T3-05 | M3 | セキュリティ確認（HTTPS/RBAC/監査ログ） | QA / Security | セキュリティ確認レポート | 最低限のセキュリティ必須項目を満たす | T3-02,T2-09 | W10 | P1 | Not Started |
| T3-06 | M3 | リリース判定会（Go/No-Go） | PM / Tech Lead | リリース判定記録 | Blocker=0、MVP DoD満足、未解消リスクに対処方針あり | T3-01..T3-05 | W10 | P0 | Not Started |

### 3.4 MVPカバレッジ対応表

| MVP要件 | 対応Task |
|---|---|
| People | T2-02 |
| Contracts | T2-03 |
| Projects | T2-04 |
| Invoices | T2-07 |
| Matrix連携 | T2-08 |

---

## 4. 依存関係・クリティカルパス

### 4.1 主要依存関係

1. T1-03（RBAC確定） -> T2-01（認証連携）
2. T1-04（Keycloak同期決定） -> T2-01（認証連携）
3. T2-01（認証連携） -> T2-02/T2-03/T2-04/T2-07（主要業務機能）
4. T2-07（Invoice実装） + T2-09（監査ログ） -> T3-03（請求フロー試験）
5. T2-03/T2-05/T2-07 + T2-10（通知） -> T3-01（結合試験）

### 4.2 クリティカルパス

T1-03 -> T1-04 -> T2-01 -> T2-02 -> T2-03 -> T2-07 -> T2-09 -> T3-01 -> T3-02 -> T3-06

---

## 5. リスクと対策

| リスクID | リスク内容 | 影響 | 対策 | 解決Task | 解決期限 |
|---|---|---|---|---|---|
| R-01 | RBAC方式未確定 | 全機能の認可設計遅延 | 方式をW1で決定しAPI単位権限定義を固定 | T1-03 | W1 |
| R-02 | Keycloak同期方式未確定 | ログイン後の属性不整合 | 同期方式と失敗時再同期設計を確定 | T1-04 | W2 |
| R-03 | Matrix運用方式未確定 | Room連携実装遅延 | Synapse/運用責任分界を先に合意 | T1-05 | W2 |
| R-04 | 通知実行基盤未確定 | 契約/請求通知の遅延・欠落 | 実行方式と再送戦略を先行決定 | T1-06 | W2 |
| R-05 | 請求テンプレ仕様未確定 | Invoice実装の手戻り | 入力項目と状態遷移をW2で凍結 | T1-07 | W2 |

---

## 6. 進捗更新ルール

1. 更新頻度: 週次（毎週末）+ マイルストーン開始/終了時
2. 更新責任: 各Task担当者が更新、PMが週次で監査
3. 記載ルール:
   - ステータス更新時は「更新日」「進捗率」「阻害要因」を追記
   - `Blocked` は24時間以内に解除方針を記載
   - 完了時は成果物リンクと受け入れ証跡を添付
4. 優先度変更:
   - P0/P1変更はPM承認必須
5. 遅延基準:
   - 期限超過見込み48時間前にエスカレーション

---

## 7. 完了定義（Definition of Done）

### 7.1 Task DoD

- 受け入れ条件を満たす証跡がある
- 依存Taskと矛盾しない
- 監査ログ対象操作は記録確認済み
- 必要な権限制御が適用済み

### 7.2 Milestone DoD

- M1: 未確定事項が全て「決定」または「期限付き継続課題」に変換済み
- M2: MVP 5機能 + 基盤機能（Auth/監査ログ/通知）が統合動作
- M3: 結合/権限/業務フロー/非機能試験完了、Go判定済み

### 7.3 プロジェクトDoD

- MVP要件（People/Contracts/Projects/Invoices/Matrix）が本番相当環境で再現可能
- KPI計測可能状態（契約更新漏れ、請求遅延、人材検索速度）を満たす
- 既知課題に優先度と対応計画が付与され、運用に引き継ぎ済み

---

## 8. 実装開始ログ（2026-03-05）

- 更新日: 2026-03-05
- 進捗率: 約8%（初期骨格）
- 阻害要因: ローカル環境にGo実行環境が未導入（`go: command not found`）

実施内容:

1. リポジトリ初期構成を作成（`backend/`, `frontend/`, `docs/`）
2. M1成果物の初版を追加
   - `docs/design/m1-decisions.md`
   - `docs/adr/0001-rbac-mvp.md`
   - `docs/design/task-status.md`
3. T2-01/T2-02の着手としてGo API雛形を追加
   - `backend/cmd/api/main.go`
   - `backend/internal/rbac/rbac.go`
   - `backend/internal/auth/context.go`
   - `backend/internal/httpx/router.go`
   - `backend/internal/people/handler.go`
4. 初期DBスキーマ（MVP主要エンティティ + 監査ログ）を追加
   - `backend/migrations/0001_init.sql`

追記（同日）:

5. People機能の設計をサービス分離へ更新（T2-02継続）
   - Handler/Service/Repositoryを分離
   - 検索フィルタ（q/type/role/status）対応
   - 取得APIとstatus更新APIを追加
6. 監査ログフックを追加（T2-09先行着手）
   - `person.create`
   - `person.update_status`
7. API仕様ドラフトを追加
   - `docs/design/people-api.md`
8. Matrix連携設計とAPI雛形を追加（T1-05）
   - `docs/design/matrix-integration.md`
   - `backend/internal/matrix/*`
   - `GET/POST /api/v1/rooms`
   - `POST /api/v1/rooms/{roomID}/members/sync`
   - `GET /api/v1/rooms/{roomID}/links`（Element Web/Mobile deep link）
9. Matrix Adapter切替を追加（T1-05継続）
   - `MATRIX_CLIENT_MODE=stub/http` で実装切替
   - `http` モード用に homeserver/token 設定を追加
   - 外部依存なしで進めるため `stub` をデフォルト化
10. 実際に開けるローカルWebデモを追加
   - `apps/web` に依存なしNodeサーバー + UIを追加
   - People/Rooms APIを同梱して画面から操作可能化
   - `http://localhost:3001` で起動確認、ブラウザ表示確認済み
11. WebデモUIをSlackライクへ改修
   - 3ペイン（Workspace / Channel / Detail）構成へ変更
   - 配色を白背景・赤キーカラー・黒文字に統一
   - 将来の日本語完全対応に向けて文言辞書（i18n雛形）を導入
12. Contracts機能の初期実装を追加（T2-03先行）
   - `GET/POST /api/v1/contracts`
   - `PATCH /api/v1/contracts/{contractID}/status`
   - WebデモにContracts作成フォーム・一覧・ステータス更新UIを追加
