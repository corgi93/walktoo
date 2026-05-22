# walkToo Claude Code Guide

공통 컨텍스트는 `AGENTS.md`를 single source of truth로 따른다. Claude는 아래 import로 동일 내용을 읽는다.

@AGENTS.md

## Claude Sub-agents

역할별 sub-agent는 `.claude/agents/<role>.md`에 정의되어 있다.

- `planner` — 사업 기획 / BM 관점 검토
- `designer` — UI/UX·정보 위계·상태 화면·접근성 검토 (토스 디자인 리드 관점)
- `expo-developer` — Expo/React Native 앱 작업 (라인 앱 리드 관점, 점진적 리팩토링)
- `backend-developer` — server/·Supabase·동기화·결제 (라인 서버 리드 관점, 인터페이스 안정성)
- `qa` — 검증·회귀 테스트·릴리즈 전 체크

각 sub-agent는 `docs/roles/<role>.md`를 본문으로 import하므로 단일 source가 유지된다. Codex에서는 sub-agent를 사용하지 않고 `docs/roles/<role>.md`를 직접 읽는다.
