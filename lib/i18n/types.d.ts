/**
 * react-i18next 모듈 augmentation
 * - t() 호출에 자동완성/타입체크 제공
 * - resources를 ko 기준으로 추론
 */

import 'react-i18next';

import type auth from './locales/ko/auth.json';
import type calendar from './locales/ko/calendar.json';
import type common from './locales/ko/common.json';
import type couple from './locales/ko/couple.json';
import type diary from './locales/ko/diary.json';
import type error from './locales/ko/error.json';
import type home from './locales/ko/home.json';
import type notification from './locales/ko/notification.json';
import type permission from './locales/ko/permission.json';
import type premium from './locales/ko/premium.json';
import type profile from './locales/ko/profile.json';
import type question from './locales/ko/question.json';
import type reflection from './locales/ko/reflection.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      home: typeof home;
      diary: typeof diary;
      auth: typeof auth;
      couple: typeof couple;
      profile: typeof profile;
      notification: typeof notification;
      permission: typeof permission;
      reflection: typeof reflection;
      question: typeof question;
      error: typeof error;
      premium: typeof premium;
      calendar: typeof calendar;
    };
  }
}
