// config.js
// Supabaseの接続設定を一箇所で管理するファイル

// ↓ ここに自分のURLとKeyを入れてください！
const SUPABASE_URL = 'https://daexakehxcvspmthpzzf.supabase.co'; // プロジェクトURL（履歴から復元しました）
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZXhha2VoeGN2c3BtdGhwenpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjc0ODgsImV4cCI6MjA4MzgwMzQ4OH0.xpHRjDPWlch_D80v1QQ9k_CJV6Q39pDa5f9qQ470rMI';

// クライアントを作成（これが全ページで使われます）
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);