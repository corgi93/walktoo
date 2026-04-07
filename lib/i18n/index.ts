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
 */

import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import koAuth from './locales/ko/auth.json';
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

// ─── 지원 로케일 ────────────────────────────────────────

export const SUPPORTED_LOCALES = ['ko'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const FALLBACK_LOCALE: SupportedLocale = 'ko';

// ─── 디바이스 로케일 감지 ────────────────────────────────

const getDeviceLocale = (): SupportedLocale => {
  const locales = Localization.getLocales();
  const deviceLang = locales[0]?.languageCode ?? FALLBACK_LOCALE;
  return (SUPPORTED_LOCALES as readonly string[]).includes(deviceLang)
    ? (deviceLang as SupportedLocale)
    : FALLBACK_LOCALE;
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
  },
};

// ─── i18next 초기화 ─────────────────────────────────────

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

export default i18n;
