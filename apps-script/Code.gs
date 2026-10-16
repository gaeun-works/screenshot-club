/**
 * 마케터 스크린샷 털이 클럽 · 오픈 알림 신청 → Google Sheets 저장
 *
 * 시트에서 [확장 프로그램 → Apps Script]로 열었다면 SPREADSHEET_ID는 비워둬도 돼요.
 * (그 시트에 자동으로 저장돼요. 다른 시트에 저장할 때만 ID를 넣으세요.)
 *   SPREADSHEET_ID: 시트 URL의 /d/ 와 /edit 사이 문자열
 *                   https://docs.google.com/spreadsheets/d/【여기】/edit
 *   SHEET_NAME:     저장할 탭 이름 (없으면 자동으로 만들어요)
 *
 * 배포: 배포 → 새 배포 → 유형 '웹 앱' → 실행: 나 / 액세스: 모든 사용자
 *       나온 URL(…/exec)을 site.js 의 APPS_SCRIPT_WEB_APP_URL 에 붙여넣기
 */
const SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_HERE';
const SHEET_NAME = '알림신청';

const HEADERS = [
  'Timestamp', 'Name', 'Email', 'Status', 'Privacy Consent', 'Intent', 'Expected Benefits',
  'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'UTM Term', 'Landing URL', 'Referrer',
];

// Only these values are accepted for choice questions (must match apply.html)
const STATUS_OPTIONS = ['현직 마케터', '마케터 취업 준비 중', '다른 직무에서 일하고 있음', '대학생', '프리랜서 / 1인 사업자', '기타'];
const INTENT_OPTIONS = ['꼭 참여해보고 싶어요', '일정이 맞으면 참여하고 싶어요', '조금 더 내용을 보고 결정하고 싶어요', '아직 잘 모르겠어요'];
const BENEFIT_OPTIONS = [
  '쌓아둔 레퍼런스를 제대로 분석해보는 것',
  '다른 마케터가 저장한 레퍼런스를 보는 것',
  '다른 사람의 레퍼런스를 내 카피로 변형해보는 것',
  '참가자들의 레퍼런스를 모은 공유 아카이브',
  'AI 레퍼런스 아카이빙 툴',
  '마케터들과 함께 레퍼런스를 공유하는 경험',
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Honeypot filled → bot. Pretend success, save nothing.
    if (data.website) return json_({ ok: true });

    const name = text_(data.name, 40);
    const email = text_(data.email, 100);
    const status = text_(data.status, 40);
    if (!name || !EMAIL_RE.test(email) || STATUS_OPTIONS.indexOf(status) === -1 || data.privacy_consent !== 'Y') {
      return json_({ ok: false, error: 'invalid_input' });
    }

    const intent = INTENT_OPTIONS.indexOf(data.intent) === -1 ? '' : data.intent;
    const benefits = (Array.isArray(data.benefits) ? data.benefits : [])
      .filter(b => BENEFIT_OPTIONS.indexOf(b) !== -1)
      .join(', ');

    const row = [
      timestamp_(data.submitted_at),
      name,
      email,
      status,
      '동의',
      intent,
      benefits,
      text_(data.utm_source, 200),
      text_(data.utm_medium, 200),
      text_(data.utm_campaign, 200),
      text_(data.utm_content, 200),
      text_(data.utm_term, 200),
      text_(data.landing_url, 1000),
      text_(data.referrer, 1000),
    ].map(safeCell_);

    getSheet_().appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server_error' });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser shows this — handy for checking the deploy.
function doGet() {
  return json_({ ok: true, message: 'alert form endpoint is running' });
}

// Run once from the editor (▶ 실행) to create the tab + header row and grant permissions.
function setupSheet() {
  getSheet_();
}

function getSheet_() {
  const useId = SPREADSHEET_ID && SPREADSHEET_ID !== 'PASTE_SPREADSHEET_ID_HERE';
  const ss = useId ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

// Client submitted_at (ISO) shown in KST; falls back to server time if missing/invalid.
function timestamp_(iso) {
  const d = iso ? new Date(iso) : new Date();
  const when = isNaN(d.getTime()) ? new Date() : d;
  return Utilities.formatDate(when, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
}

function text_(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

// Stop spreadsheet formula injection (values starting with = + - @)
function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
