# 김현수 · 김현선 모바일 청첩장 v2

Python으로 내용을 관리하고, 최종 결과는 GitHub Pages에서 열리는 정적 웹사이트로 생성하는 구조입니다.

## 반영된 기능

- 차분하고 밝은 미니멀 디자인
- 음악·방명록·카카오톡 공유 제외
- 청첩장 URL 복사
- 네이버 지도 앱 자동차 길찾기(앱 미설치 시 장소 페이지 연결), 카카오 길찾기 버튼
- 약도 이미지 영역
- 대중교통 안내와 주차 안내
- 예식일 달력과 D-day 자동 계산
- 커버사진 1장 자동 인식
- 갤러리 폴더의 사진을 파일명 순서대로 자동 인식
- 계좌정보는 현재 숨김
- GitHub Actions 자동 빌드·배포

## 1. 가장 쉬운 수정 방법

1. `wedding_config.py`를 메모장이나 Visual Studio Code로 엽니다.
2. 신랑·신부, 날짜, 장소, 교통, 주차, 계좌정보를 수정합니다.
3. `실행_미리보기.bat`를 더블 클릭합니다.
4. 브라우저에서 수정 결과를 확인합니다.

명령 프롬프트에서 직접 실행할 때는 다음과 같습니다.

```bash
py manage.py preview
```

최종 배포용 파일만 만들려면 다음 명령을 사용합니다.

```bash
py manage.py build
```

생성 결과는 `dist` 폴더에 저장됩니다.

## 2. 사진 넣기

### 커버사진

`photos/cover` 폴더에 사진 1장을 넣습니다.

- 권장 파일명: `cover.jpg`
- 여러 장이 있으면 파일명 순서상 첫 번째 사진만 사용합니다.

### 갤러리사진

`photos/gallery` 폴더에 사진을 넣습니다.

- 권장 파일명: `01.jpg`, `02.jpg`, `03.jpg` …
- 파일명 순서대로 자동 배치됩니다.
- `wedding_config.py`에 사진 파일명을 하나씩 적을 필요가 없습니다.

### 약도

`photos/map` 폴더에 약도 이미지 1장을 넣습니다.

- 권장 파일명: `map.jpg` 또는 `map.png`
- 약도가 없으면 기본 임시 약도가 표시됩니다.

## 3. 예식장 변경 시 수정 항목

`wedding_config.py`의 `venue`에서 아래 항목을 함께 바꿉니다.

- `name`
- `hall`
- `address`
- `phone`
- `latitude`
- `longitude`
- `naver_place_url`
- `kakao_place_url`
- `kakao_place_id`

교통편과 주차 안내도 장소 확정 후 다시 확인해야 합니다.

## 4. GitHub Pages 배포 방식

GitHub Pages 자체에서 Python 서버가 계속 실행되는 것은 아닙니다. 저장소에 파일을 올리면 GitHub Actions가 `python manage.py build`를 실행하고, 생성된 `dist` 폴더를 정적 웹사이트로 배포합니다.

### 최초 설정

1. GitHub 계정을 만듭니다.
2. 새 저장소를 만들고 이름을 예를 들어 `wedding-invitation`으로 정합니다.
3. 이 폴더 안의 파일과 폴더를 저장소에 모두 업로드합니다.
4. 저장소의 `Settings` → `Pages`로 이동합니다.
5. `Build and deployment`의 `Source`를 `GitHub Actions`로 선택합니다.
6. `main` 브랜치에 파일을 올리면 자동 배포됩니다.

주소는 일반적으로 다음 형식입니다.

```text
https://GitHub아이디.github.io/저장소이름/
```

예를 들어 아이디가 `hyeonsu`이고 저장소가 `wedding-invitation`이면 다음과 같습니다.

```text
https://hyeonsu.github.io/wedding-invitation/
```

첫 배포 후 실제 주소가 나오면 `wedding_config.py`의 `site.url`에 해당 주소를 입력하고 다시 업로드하세요. 링크 미리보기 대표사진과 주소 정보가 더 안정적으로 적용됩니다.

## 5. GitHub에서 사진을 자동 반영하는 방식

가능합니다.

1. GitHub 저장소의 `photos/gallery` 폴더에 사진을 추가합니다.
2. 변경사항을 `main` 브랜치에 저장합니다.
3. GitHub Actions가 사진 폴더를 자동으로 검색합니다.
4. 파일명 순서대로 갤러리를 다시 만들고 Pages에 배포합니다.

따라서 갤러리 목록을 코드에 직접 입력할 필요가 없습니다.

## 6. iCloud 사용 시

- iCloud 사진이나 iCloud Drive에 있는 원본을 컴퓨터로 내려받은 뒤 `photos` 폴더에 복사하는 방식이 안정적입니다.
- 비공개 iCloud 사진 보관함을 GitHub Pages가 직접 읽을 수는 없습니다.
- 공개 iCloud 공유 링크를 사진 주소로 직접 연결하는 방식은 링크 변경, 만료, 접근 제한 가능성이 있어 권장하지 않습니다.
- GitHub Desktop으로 저장소를 관리하면 사진 추가와 업로드가 비교적 쉽습니다.

## 7. 개인정보 주의

GitHub Pages로 배포한 청첩장은 인터넷에서 접근할 수 있습니다. 사진, 이름, 예식 정보, 전화번호, 계좌번호를 넣을 때 공개 범위를 고려하세요. 특히 계좌정보를 표시하면 페이지 소스에도 포함됩니다.

## 현재 임시 정보

- 신랑: 김현수
- 신부: 김현선
- 일시: 2027년 10월 9일 토요일 오후 1시
- 장소: 호텔 ICC
- 주소: 대전광역시 유성구 엑스포로123번길 55
- 카카오 장소 ID: 21086510

예식 일시와 장소 확정 후 최종 수정하세요.
