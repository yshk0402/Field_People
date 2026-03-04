# Field People — REQUIREMENTS.md（Draft）

> 注意：本ドキュメントはドラフトです。不明点は推測で埋めず、`{{TODO: 未確定}}` として残します。

## 1. 概要

### 1.1 システム名

* Field People

### 1.2 目的

* Field に関わる全ての人材（社員・業務委託・副業・パートナー）を統合管理する
* 対象：人材情報 / 契約 / 稼働 / 請求 / コミュニケーション

### 1.3 解決する問題

* 情報が Spreadsheet / Slack / Drive / Email / Notion に分散
* 契約更新漏れ、請求漏れ、権限管理ミスを削減

### 1.4 コンセプト

* People OS

中心概念：

* `Person`

関連：

* `Person` → `Contract` / `Project` / `Room` / `Invoice` / `Timesheet` / `Task`

## 2. ユーザーと権限

### 2.1 ロール

* Admin：全機能（人材/契約/支払い/権限管理）
* BackOffice：契約/請求/支払い
* Member：プロジェクト/チャット/タスク
* Talent：自分のプロジェクト/請求提出/稼働入力

### 2.2 RBAC 方針

* 方式：{{TODO: 未確定（simple role only / role+permission）}}
* 監査ログ：必須（誰がいつ何を変更したか）

## 3. システム構成（OSSベース）

* Frontend：Next.js
* Backend：Go
* DB：PostgreSQL
* Chat：Matrix
* Auth：Keycloak
* Storage：MinIO

> デプロイ環境（VPS / AWS / GCP / On-prem）は {{TODO: 未確定}}。

## 4. データモデル（論理）

### 4.1 Person

* person_id
* name
* display_name
* email
* type（employee / contractor / partner）
* role（admin / backoffice / member / talent）
* skills
* availability
* status
* created_at
* updated_at

### 4.2 Contract

* contract_id
* person_id
* contract_type
* rate
* currency
* start_date
* end_date
* payment_terms
* document_url
* status

### 4.3 Project

* project_id
* name
* description
* status
* start_date
* end_date
* pm

### 4.4 Invoice

* invoice_id
* person_id
* period
* amount
* currency
* status（draft / submitted / approved / paid）
* file_url
* submitted_at
* approved_at
* paid_at

### 4.5 Timesheet

* timesheet_id
* person_id
* project_id
* date
* hours
* notes

### 4.6 Task

* task_id
* title
* description
* assignee
* project_id
* due_date
* status

### 4.7 Room（Matrix）

* room_id（Matrix room id）
* type（person_room / project_room / community_room）
* related_person_id?（任意）
* related_project_id?（任意）

## 5. 機能要件

### 5.1 認証（Keycloak）

* ログイン
* 招待
* パスワードリセット

未確定：

* Keycloak とアプリ側ユーザー同期方式：{{TODO: 未確定（OIDC claims / SCIM / 定期同期など）}}

### 5.2 人材管理

* 人材登録
* 人材検索
* スキル検索
* 稼働検索

### 5.3 契約管理

* 契約登録
* 契約更新通知（30日 / 14日 / 7日）
* 契約終了通知

### 5.4 プロジェクト管理

* プロジェクト作成
* メンバー追加
* ロール設定（プロジェクト内ロール）
* タスク管理（最低限）

### 5.5 チャット（Matrix）

* Room 種別：person_room / project_room / community_room
* Room 画面：チャット / ファイル / タスク

未確定：

* Matrix 連携方式：{{TODO: 未確定（自前Synapse / Element Cloud / 既存Matrix）}}
* Bot/Service account の運用：{{TODO: 未確定}}

### 5.6 請求管理

* Talent：請求提出（ファイルアップロード + 入力項目）
* BackOffice：承認
* 支払い記録

未確定：

* 請求の入力テンプレ：{{TODO: 未確定（固定フォーム / カスタム項目）}}

### 5.7 稼働管理

* 稼働入力（Timesheet）
* 稼働承認

### 5.8 通知

対象：

* 契約更新
* 請求提出
* タスク期限

手段：

* Matrix
* Email

未確定：

* 通知実行基盤：{{TODO: 未確定（Go job / cron / queue+worker）}}

## 6. UI / UX

### 6.1 UIコンセプト

* Slack + Linear + Notion
* 左ナビ / 中央コンテンツ / 右詳細
* 業務管理UIはWebアプリを主軸とする（PC/モバイルブラウザ対応）

### 6.2 主要画面

* Sidebar：Dashboard / People / Projects / Rooms / Contracts / Invoices / Settings

#### Dashboard

* 契約更新
* 未提出請求
* 未承認請求
* 期限タスク

#### People

* 検索バー / フィルタ / People List
* カード：名前 / スキル / 稼働 / プロジェクト数

#### Person Detail

* Header / Profile / Projects / Contracts / Invoices / Rooms / Notes

#### Project

* プロジェクト情報 / メンバー / タスク / チャット

#### Room

* Matrix：チャット / ファイル / タスク
* クライアント想定：Element（Web版 / スマホアプリ）
* Field People本体はRoom情報・権限同期・導線提供を担当し、チャット本文の主利用はElementで行う

#### Invoice

* 一覧：提出 / 承認 / 支払
* ステータス：draft / submitted / approved / paid

## 7. UXフロー

### 7.1 タレント登録

* Admin → People作成 → Contract作成 → Room生成 → 招待

### 7.2 請求提出

* Talent → 請求アップロード → BackOffice承認 → 支払

### 7.3 契約終了

* 契約終了 → Room退出 → アクセス削除

## 8. 非機能要件

### 8.1 性能

* 同時ユーザー：50
* レスポンス：< 300ms

### 8.2 セキュリティ

* HTTPS
* RBAC
* 監査ログ

### 8.3 バックアップ

* daily backup

## 9. MVP

* People
* Contracts
* Projects
* Invoices
* Matrix連携

## 10. 開発スケジュール（目安）

* 設計：2週間
* 開発：6週間
* テスト：2週間
* 合計：約2ヶ月

## 11. 将来拡張

* AI人材検索
* AIアサイン
* 自動契約生成
* 支払い自動化

## 12. 成功指標（KPI）

* 契約更新漏れ：0件
* 請求遅延：0件
* 人材検索：3秒以内
