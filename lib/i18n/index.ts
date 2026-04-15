/**
 * i18next 초기화
 *
 * - 디바이스 로케일 자동 감지 (expo-localization)
 * - 지원 로케일에 없으면 fallback (ko)
 * - 향후 영어/일본어 추가 시 SUPPORTED_LOCALES + resources에 한 줄씩 추가
 *
 * 사용법:
 *   const { t } = useTranslation();
 *   t('home:mission.title')
 *   t('common:actions.save')
 *
 * NOTE: expo-localization은 native 모듈이라 dev client 빌드가 필요하다.
 * Expo Go 또는 native 모듈이 없는 환경에서도 앱이 죽지 않도록 모든 호출을
 * try/catch로 감싸 fallback locale로 동작한다.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import koAuth from './locales/ko/auth.json';
import koCalendar from './locales/ko/calendar.json';
import koCommon from './locales/ko/common.json';
import koCouple from './locales/ko/couple.json';
import koDiary from './locales/ko/diary.json';
import koError from './locales/ko/error.json';
import koHome from './locales/ko/home.json';
import koNotification from './locales/ko/notification.json';
import koPermission from './locales/ko/permission.json';
import koPremium from './locales/ko/premium.json';
import koProfile from './locales/ko/profile.json';
import koQuestion from './locales/ko/question.json';
import koReflection from './locales/ko/reflection.json';
import koSchedule from './locales/ko/schedule.json';

// ─── 지원 로케일 ────────────────────────────────────────

export const SUPPORTED_LOCALES = ['ko'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const FALLBACK_LOCALE: SupportedLocale = 'ko';

// ─── 디바이스 로케일 감지 ────────────────────────────────
//
// expo-localization을 require로 lazy load하고, 실패해도 fallback을 반환한다.
// 이렇게 하지 않으면 native 모듈이 링크 안 된 환경(Expo Go, 미빌드 dev client)에서
// 모듈 import 시점에 throw → 앱이 부팅조차 못 한다.

const getDeviceLocale = (): SupportedLocale => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Localization = require('expo-localization') as {
      getLocales?: () => { languageCode?: string | null }[];
    };
    const locales = Localization.getLocales?.() ?? [];
    const deviceLang = locales[0]?.languageCode ?? FALLBACK_LOCALE;
    return (SUPPORTED_LOCALES as readonly string[]).includes(deviceLang)
      ? (deviceLang as SupportedLocale)
      : FALLBACK_LOCALE;
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        '[i18n] expo-localization unavailable — using fallback locale. ' +
          'Rebuild dev client to enable device locale detection.',
        e,
      );
    }
    return FALLBACK_LOCALE;
  }
};

// ─── 리소스 ─────────────────────────────────────────────

export const NAMESPACES = [
  'common',
  'home',
  'diary',
  'auth',
  'couple',
  'profile',
  'notification',
  'permission',
  'reflection',
  'question',
  'error',
  'premium',
  'calendar',
  'schedule',
] as const;

const resources = {
  ko: {
    common: koCommon,
    home: koHome,
    diary: koDiary,
    auth: koAuth,
    couple: koCouple,
    profile: koProfile,
    notification: koNotification,
    permission: koPermission,
    reflection: koReflection,
    question: koQuestion,
    error: koError,
    premium: koPremium,
    calendar: koCalendar,
    schedule: koSchedule,
  },
};

// ─── i18next 초기화 ─────────────────────────────────────
// init 자체가 어떤 이유로든 throw해도 module load는 성공해야 한다.
// (앱이 부팅하지 못하는 것보다 t() fallback이 동작하는 게 낫다)

try {
  void i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: getDeviceLocale(),
      fallbackLng: FALLBACK_LOCALE,
      defaultNS: 'common',
      ns: NAMESPACES as unknown as string[],
      interpolation: {
        escapeValue: false, // React가 이미 이스케이프함
      },
      react: {
        useSuspense: false,
      },
      saveMissing: __DEV__,
      missingKeyHandler: (_lngs, ns, key) => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn(`[i18n] missing key: ${ns}:${key}`);
        }
      },
      returnNull: false,
    });
} catch (e) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error('[i18n] init failed', e);
  }
}

export default i18n;
