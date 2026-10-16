/* ==========================================================================
   마케터 스크린샷 털이 클럽 · 공통 설정 + 측정
   index.html / apply.html / thanks.html 모두 <head>에서 이 파일을 불러와요.

   ▼ 아래 3개 값만 채우면 돼요. 비워두면 해당 기능은 꺼진 상태로 동작해요.
   ========================================================================== */
const SITE_CONFIG = {
  GA4_MEASUREMENT_ID: 'G-MVTMSNH1ET',
  META_PIXEL_ID: '',             // 예: '123456789012345'
  APPS_SCRIPT_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxXWFmSmYqAYxNUwo8tCJ1znIiyptklJbLGxfVfV20oEC2GVUD2f0ekAFXMBWrBmfiO/exec',
  DEBUG: false,                  // true면 이벤트 이름·파라미터를 console에 표시 (개인정보는 절대 포함되지 않음)
};

(function () {
  // ---- sessionStorage helpers (차단된 브라우저에서도 에러 없이 동작)
  function ssGet(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } }
  function ssSet(key, value) { try { sessionStorage.setItem(key, value); } catch (e) {} }
  function ssDel(key) { try { sessionStorage.removeItem(key); } catch (e) {} }

  // ---- UTM: 처음 들어온 URL의 UTM을 저장해두고, 폼 페이지까지 그대로 유지
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  function getUtm() {
    const params = new URLSearchParams(location.search);
    let utm = {};
    try { utm = JSON.parse(ssGet('utm') || '{}'); } catch (e) {}
    if (UTM_KEYS.some(k => params.has(k))) {
      utm = {};
      UTM_KEYS.forEach(k => { if (params.has(k)) utm[k] = params.get(k); });
      ssSet('utm', JSON.stringify(utm));
    }
    return utm;
  }

  // ---- 랜딩 정보: 세션에서 처음 도착한 페이지 URL과 그때의 referrer
  function captureLanding() {
    if (!ssGet('landing_url')) {
      ssSet('landing_url', location.href);
      ssSet('landing_referrer', document.referrer || '');
    }
  }

  function getLanding() {
    const storedReferrer = ssGet('landing_referrer');   // '' means "arrived directly" — keep it
    return {
      landing_url: ssGet('landing_url') || location.href,
      referrer: storedReferrer !== null ? storedReferrer : (document.referrer || ''),
    };
  }

  getUtm();
  captureLanding();

  // ---- GA4 (gtag.js)
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (SITE_CONFIG.GA4_MEASUREMENT_ID) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(SITE_CONFIG.GA4_MEASUREMENT_ID);
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', SITE_CONFIG.GA4_MEASUREMENT_ID);
  }

  // ---- Meta Pixel (모든 페이지 PageView)
  if (SITE_CONFIG.META_PIXEL_ID) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', SITE_CONFIG.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // ---- 이벤트 전송 (GA4). params에는 절대 이름·이메일 같은 개인정보를 넣지 않아요.
  function utmParams() {
    const u = getUtm();
    return { utm_source: u.utm_source || '', utm_campaign: u.utm_campaign || '', utm_content: u.utm_content || '' };
  }

  function track(event, params = {}) {
    const payload = { ...params, ...utmParams() };
    window.gtag('event', event, payload);
    if (SITE_CONFIG.DEBUG) console.info('[track]', event, payload);
  }

  function pixel(event) {
    if (window.fbq) window.fbq('track', event);
    if (SITE_CONFIG.DEBUG) console.info('[pixel]', event);
  }

  window.Site = { config: SITE_CONFIG, getUtm, getLanding, utmParams, track, pixel, ssGet, ssSet, ssDel };
})();
