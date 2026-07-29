/**
 * walkToo 법적 고지 링크 (개인정보처리방침 · 이용약관)
 *
 * ⚠️ 출시 전 실제 호스팅 URL로 반드시 교체할 것.
 *    - App Store Connect의 "개인정보 처리방침 URL"에 동일 주소를 등록해야
 *      심사를 통과한다 (App Store Review Guideline 5.1.1).
 *    - Google Play Console의 "개인정보처리방침" 항목에도 동일하게 등록한다.
 *
 * 인앱 브라우저(expo-web-browser)로 열어 앱을 벗어나지 않는다.
 */

import * as WebBrowser from 'expo-web-browser';

export const LEGAL_URLS = {
  PRIVACY_POLICY: 'https://walktoo.app/privacy',
  TERMS_OF_SERVICE: 'https://walktoo.app/terms',
} as const;

export const openPrivacyPolicy = (): void => {
  WebBrowser.openBrowserAsync(LEGAL_URLS.PRIVACY_POLICY).catch(() => {});
};

export const openTermsOfService = (): void => {
  WebBrowser.openBrowserAsync(LEGAL_URLS.TERMS_OF_SERVICE).catch(() => {});
};
