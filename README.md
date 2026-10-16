# 마케터 스크린샷 털이 클럽 · 사전 수요 검증 랜딩페이지

갤러리에 쌓아두기만 한 스크린샷 속 카피를 해체하고 내 카피로 다시 써보는 7일 모임, **마케터 스크린샷 털이 클럽**의 오픈 전 수요를 검증하기 위한 랜딩페이지입니다.

결제 대신 **오픈 알림 신청**을 전환 목표로 두고, 메타 영상 광고 소재 A/B(`utm_content`)별로 알림 신청 1건당 비용(CPL)을 측정합니다.

**Live:** https://gaeun-works.github.io/screenshot-club/

## 퍼널

```
메타 영상 광고 (utm_content=video_hook_a / video_hook_b)
  → 상세페이지 index.html        landing_view, click_alert(cta_location)
  → 알림 신청 폼 apply.html      → Google Apps Script → Google Sheets
  → 신청 완료 thanks.html        GA4 generate_lead + Meta Pixel Lead (신청 성공 시 1회)
```

## 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 상세페이지 |
| `apply.html` | 알림 신청 폼 (필수값 검증, 중복 제출 방지) |
| `thanks.html` | 신청 완료 페이지, 전환 이벤트 발생 |
| `site.js` | 측정 ID·저장 URL 설정, UTM 유지, GA4·Meta Pixel |
| `apps-script/Code.gs` | 신청 내용을 Google Sheets에 저장하는 Apps Script |

별도 서버·DB 없이 정적 HTML/CSS/JS + Google Apps Script로만 구성했습니다.

## 개인정보

- 신청 내용(이름/닉네임, 이메일, 현재 상태)은 비공개 Google Sheets에만 저장되며 이 저장소에는 포함되지 않습니다.
- GA4·Meta Pixel 이벤트에는 이름·이메일을 보내지 않습니다.
- 보유 기간: 1기 오픈 여부 확정 및 안내 완료 시까지 (최장 3개월)
