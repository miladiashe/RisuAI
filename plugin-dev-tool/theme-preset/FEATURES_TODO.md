# Theme Preset Manager - 기능 추가 목록

원본 `theme-preset-plugin-fix3.js`에 있는 기능들을 간소화 버전에 추가하는 체크리스트입니다.

## ✅ 현재 구현된 기능

### 기본 프리셋 관리
- [x] 프리셋 이름 입력 + 저장 버튼
- [x] 프리셋 목록 표시
- [x] 프리셋 로드 버튼
- [x] 프리셋 삭제 버튼 (확인 모달 포함)
- [x] 플로팅 윈도우 드래그
- [x] 키보드 단축키 (Ctrl+Alt+X)
- [x] 오버레이 클릭 시 닫기

### 백엔드 로직 (UI 없음)
- [x] 자동 테마 전환 로직 (auto-switch.ts)
- [x] 캐릭터 매핑 저장/로드 (storage.ts)
- [x] 기본 테마 설정 (storage.ts)
- [x] 프리셋 임포트/익스포트 로직 (storage.ts)

---

## 📋 추가할 기능 목록

### ✅ 1️⃣ 프리셋 목록 개선 (난이도: ⭐) - **완료**

**프리셋 각 아이템에 추가할 버튼:**
- [x] ✏️ **Rename** - 이름 변경 버튼
  - 모달 대화상자로 새 이름 입력
  - 중복 검사
  - 캐릭터 매핑 자동 업데이트

- [x] 💾 **Export** - 개별 익스포트 버튼
  - JSON 파일로 다운로드
  - 파일명: `{preset-name}_theme_preset.json`

**프리셋 정보 표시 개선:**
- [x] 날짜 표시 개선
- [x] 테마 타입 표시 (예: `dracula`, `custom`)
- [x] 커스텀 컬러 여부 표시 (🎨 아이콘)
- [x] 커스텀 텍스트 테마 여부 표시 (📝 아이콘)
- [x] 호버 효과 개선

**Load 버튼 동작:**
- [x] 현재: 바로 로드 (유지)

---

### ✅ 2️⃣ 임포트/익스포트 섹션 (난이도: ⭐⭐) - **완료**

**개별 테마 파일 임포트:**
```
┌────────────────────────────────────┐
│ [📂 Import Theme File]             │
└────────────────────────────────────┘
```
- [x] 버튼 추가
- [x] 파일 선택 대화상자
- [x] JSON 파싱 및 검증
- [x] 기존 프리셋과 병합

**전체 백업:**
```
┌────────────────────────────────────┐
│ Complete Backup                    │
│ [📦 Export Backup] [📥 Import]     │
└────────────────────────────────────┘
```
- [x] Export Backup 버튼
  - 모든 테마 + 캐릭터 매핑 + 설정을 하나의 JSON으로
  - 파일명: `risu_theme_backup_YYYY-MM-DD.json`
  - 백업 내용 요약 모달

- [x] Import Backup 버튼
  - 전체 백업 파일 선택
  - 병합/덮어쓰기 선택 모달 (Replace All / Merge)
  - 임포트 결과 요약
  - 구형 포맷 지원 (배열 형식)

---

### ✅ 3️⃣ 캐릭터 자동 전환 섹션 (난이도: ⭐⭐⭐) - **완료**

**전체 구조:**
```
┌──────────────────────────────────────────────┐
│ ⚡ Character Auto-Switch    [✓] Enable      │
├──────────────────────────────────────────────┤
│ Default Theme: [MyTheme] [Remove]            │
├──────────────────────────────────────────────┤
│ Current Character: Alice                     │
├──────────────────────────────────────────────┤
│ Character Mapping List:                      │
│ ┌────────────────────────────────────┐      │
│ │ Alice → DarkTheme      [Remove]    │      │
│ │ Bob → LightTheme       [Remove]    │      │
│ └────────────────────────────────────┘      │
├──────────────────────────────────────────────┤
│ [Current Char] [Select Theme]                │
│ [➕ Add Mapping] [Set as Default]           │
└──────────────────────────────────────────────┘
```

**3-1. Auto-Switch Toggle**
- [x] 체크박스 추가 (`id="auto-switch-toggle"`)
- [x] 토글 시 `setAutoSwitchEnabled()` 호출
- [x] 상태에 따라 섹션 표시/숨김
- [x] `startAutoSwitch()` / `stopAutoSwitch()` 호출

**3-2. Default Theme Display**
- [x] 기본 테마 표시 영역 (`id="default-theme-container"`)
- [x] 기본 테마 이름 표시 (`id="default-theme-name"`)
- [x] Remove 버튼 (`id="remove-default-theme-btn"`)
- [x] 기본 테마 없으면 숨김

**3-3. Character Mapping List**
- [x] 매핑 목록 컨테이너 (`id="character-mapping-list"`)
- [x] 각 매핑 아이템 표시
  - 캐릭터 이름 → 테마 이름
  - Remove 버튼
- [x] 스크롤 영역 (max-height: 200px)
- [x] `updateCharacterMappingList()` 함수

**3-4. Add Mapping Section**
- [x] 현재 캐릭터 입력 (`id="add-mapping-character"`, readonly)
  - `updateCurrentCharacterName()` 함수로 자동 업데이트
- [x] 테마 선택 드롭다운 (`id="add-mapping-theme"`)
  - `updateThemeSelectDropdown()` 함수로 옵션 채우기
- [x] ➕ Add Mapping 버튼 (`id="add-mapping-btn"`)
  - `addCharacterThemeMapping()` 호출
- [x] Set as Default 버튼 (`id="set-as-default-btn"`)
  - 선택한 테마를 기본 테마로 설정

**3-5. 관련 업데이트 함수**
- [x] `updateCharacterMappingList()` - 매핑 목록 새로고침
- [x] `updateThemeSelectDropdown()` - 테마 드롭다운 옵션 업데이트
- [x] `updateCurrentCharacterName()` - 현재 캐릭터 이름 표시
- [x] `updateDefaultThemeDisplay()` - 기본 테마 표시 업데이트
- [x] `updateAutoSwitchUI()` - 모든 UI 한 번에 업데이트

---

### ✅ 4️⃣ 단축키 설정 (난이도: ⭐) - **완료**

**푸터 영역:**
```
┌──────────────────────────────────────────────┐
│ Press [Ctrl+Alt+X] to toggle  [⌨️ Change]   │
└──────────────────────────────────────────────┘
```

- [x] Change Shortcut 버튼 추가 (`id="change-shortcut-btn"`)
- [x] 클릭 시 모달 열기
  - 현재 단축키 표시
  - 단축키 입력 필드
  - 예제 표시 (ctrl+shift+p, alt+t 등)
  - 유효성 검사 (최소 하나의 modifier + 키)
  - Invalid modifier 검사
  - 저장 및 표시 업데이트
- [x] `updateShortcutDisplay()` 함수
- [x] 성공 메시지 표시

---

### 5️⃣ UI/UX 개선 (난이도: ⭐)

- [ ] 빈 상태 메시지 개선
  - 큰 아이콘 + 설명 텍스트
- [ ] 버튼 호버 효과 통일
- [ ] 애니메이션 추가
  - fadeIn, slideIn
- [ ] 성공 피드백 개선
  - `showButtonFeedback()` 활용
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 통일

---

## 🎯 구현 우선순위

### ✅ Phase 1 - 프리셋 관리 완성 (가장 자주 사용) - **완료**
1. ✅ ✏️ Rename 버튼
2. ✅ 💾 Export 버튼
3. ✅ 프리셋 상세 정보 표시

### ✅ Phase 2 - 백업/복원 (데이터 안전) - **완료**
4. ✅ 📂 Import Theme File
5. ✅ 📦 Export Backup
6. ✅ 📥 Import Backup (Replace All / Merge)

### ✅ Phase 3 - 자동 전환 UI (고급 기능) - **완료**
7. ✅ Auto-Switch Toggle
8. ✅ Default Theme Display
9. ✅ Character Mapping List
10. ✅ Add Mapping Section

### ✅ Phase 4 - 기타 - **완료**
11. ✅ Change Shortcut
12. ⏸️ UI/UX 개선 (향후 필요시)

---

## 📝 참고사항

**원본 파일 위치:**
- `plugin-dev-tool/example/theme-preset-plugin-fix3.js`
- UI 코드: 738-2050줄 정도
- 이벤트 핸들러: 996-1630줄

**주요 함수 매핑:**
- `renameThemePreset()` - storage.ts에 이미 있음
- `exportThemePreset()` - storage.ts에 이미 있음
- `importThemePreset()` - storage.ts에 이미 있음
- `addCharacterThemeMapping()` - storage.ts에 이미 있음
- `removeCharacterThemeMapping()` - storage.ts에 이미 있음
- `getCharacterThemeMap()` - storage.ts에 이미 있음
- `setAutoSwitchEnabled()` - auto-switch.ts에 이미 있음

➡️ **대부분의 백엔드 로직은 이미 구현되어 있으므로, UI만 추가하면 됩니다!**

---

## ✅ 완료 체크

구현이 완료되면 각 항목을 `- [x]`로 표시하고, 빌드 후 dist 파일을 커밋합니다.

---

## 🎉 리팩토링 완료!

**Phase 1-4 모두 완료되었습니다!**

### 빌드 히스토리:
- 초기 버전: 29 KB
- Phase 1 완료: 36.94 KB (+7.94 KB) - Rename, Export, 상세 정보
- Phase 2 완료: 48.98 KB (+12.04 KB) - Import/Export Backup
- Phase 3 완료: 62.67 KB (+13.69 KB) - Character Auto-Switch UI
- Phase 4 완료: 68.67 KB (+6 KB) - Change Shortcut

### 최종 기능:
✅ 프리셋 관리 (저장, 로드, 삭제, 이름 변경, 익스포트)
✅ 개별 테마 파일 임포트
✅ 전체 백업/복원 (병합/덮어쓰기)
✅ 캐릭터 자동 전환 (매핑, 기본 테마)
✅ 단축키 커스터마이징
✅ 상세 정보 표시 (날짜, 테마 타입, 커스텀 표시)

**원본 2321줄 JavaScript → 모듈형 TypeScript 프로젝트로 성공적으로 리팩토링 완료! 🚀**
