# CookSnap - AI Development Guidelines

## Project Overview
레시피 수집 & 쿠킹 가이드 앱. React Native + Expo (SDK 54) + TypeScript + Expo Router.

## Tech Stack
- **Framework**: React Native 0.81 + Expo SDK 54
- **Navigation**: Expo Router v6 (file-based routing)
- **Language**: TypeScript (strict mode)
- **Styling**: StyleSheet.create (NO NativeWind/Tailwind)
- **State**: Custom hook + AsyncStorage (src/store/)
- **Animation**: react-native-reanimated
- **Icons**: @expo/vector-icons (Ionicons)

## Architecture Rules

### File Structure
```
app/                    # Expo Router pages (file-based routing)
  (tabs)/               # Bottom tab navigator
  recipe/[id].tsx       # Dynamic recipe detail
  recipe/cook/[id].tsx  # Cooking mode
src/
  components/           # Reusable UI components
  store/                # Data layer (hooks + AsyncStorage)
  types/                # TypeScript type definitions
  data/                 # Sample/seed data
  theme.ts              # Design tokens (colors, typo, space, radius)
```

### Code Patterns
- **Functional components only** — no class components
- **Named exports for components**, default export for route pages
- **Colocate styles** — StyleSheet.create at bottom of each file
- **Use theme tokens** — always import from src/theme.ts, never hardcode colors/spacing
- **Type everything** — no `any`, define interfaces in src/types/

### Design System (커버링/토스 Style)
- **Background**: `colors.bgPage` (#F4F5F7) — 회색 배경 위에 흰색 카드
- **Cards**: `colors.bgPrimary` (#FFFFFF), `radius.xxl` (20px), `space.cardPad` (20px)
- **No shadows, no borders** — 색상 대비로만 구분
- **Typography hierarchy**: screenTitle(22) > heading1(20) > body1(15) > caption1(13)
- **Spacing**: 4px grid (space.xs=4, space.md=8, space.lg=12, space.xl=16)
- **Accent**: Toss blue (#3182F6)

### Styling Rules
```typescript
// GOOD — theme tokens 사용
padding: space.cardPad,
borderRadius: radius.xxl,
color: colors.textPrimary,

// BAD — 하드코딩
padding: 24,
borderRadius: 24,
color: "#1B1D21",
```

## Performance Guidelines (Callstack Best Practices)

### Re-renders
- ScrollView 대신 FlatList/FlashList 사용 (대량 리스트)
- 불필요한 useMemo/useCallback 금지 — 프로파일링 증거 없이 최적화하지 말 것
- 상태는 필요한 컴포넌트에 최대한 가깝게 배치

### Bundle Size
- Barrel import (index.ts re-export) 사용 금지 — 직접 모듈에서 import
- 사용하지 않는 패키지 즉시 제거

### Navigation
- react-native-screens 통해 네이티브 네비게이션 활용 (Expo Router 기본 제공)
- 무거운 화면은 lazy loading 고려

### Animation
- UI 스레드 애니메이션은 Reanimated worklet 사용
- 컴포넌트 렌더링과 애니메이션 로직 분리

## AI Development Workflow

### Before Writing Code
1. 요구사항을 명확히 이해하고 확인
2. 영향받는 파일 목록 파악
3. 기존 패턴과 일관성 유지

### While Writing Code
1. **한 번에 하나의 기능만** — atomic changes
2. **기존 코드 먼저 읽기** — 이해 없이 수정하지 말 것
3. **타입 안전성 유지** — 모든 props, state, 함수에 타입 명시
4. **에러 처리** — 외부 API 호출, AsyncStorage 접근 시 try/catch

### After Writing Code
1. Metro 번들 에러 없는지 확인
2. 시뮬레이터에서 실제 동작 검증
3. 다른 화면에 영향 없는지 확인

## Common Mistakes to Avoid
- ❌ NativeWind/Tailwind className 사용 (이 프로젝트는 StyleSheet만 사용)
- ❌ 색상/간격 하드코딩 (항상 theme.ts 토큰 사용)
- ❌ 불필요한 패키지 추가 (기존 Expo SDK로 해결 가능한지 먼저 확인)
- ❌ 한 파일에 여러 기능 수정 (atomic commits)
- ❌ 테스트 없이 "완료" 선언 (시뮬레이터 확인 필수)

## MVP Scope (1차)
- ✅ URL 붙여넣기 → AI 레시피 변환 + 저장
- ✅ 내 레시피 목록 + 카테고리 정리
- ✅ 쿠킹 모드 (큰 글씨 스텝, 다음 미리보기, 타이머, 인분 조절)
- ✅ 출처 링크 연결
- ❌ 음성 제어 (2차)
- ❌ AI 대체재료/변주 (2차)
- ❌ 코인/구독/광고 (3차)
