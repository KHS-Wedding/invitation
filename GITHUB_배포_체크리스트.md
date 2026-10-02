# 배포 확인

- [ ] wedding_config.py의 날짜·시간·장소·교통·계좌를 확인
- [ ] 예시 계좌는 show=False 유지, 실제 번호 확인 후 공개
- [ ] requirements.txt 설치 후 회귀 검사 통과
- [ ] python manage.py build 및 이미지 변환 경고·용량 출력 확인
- [ ] 갤러리 중앙 표시·contain·좌우 스와이프·손가락 추종 확인
- [ ] 하단 점 영역을 끝까지 드래그하여 마지막 사진 선택 확인
- [ ] 빠른 닫기·다른 사진 재열기 및 느린 통신·요청 실패 확인
- [ ] 주소·계좌·URL 복사, 지도 링크 확인
- [ ] iPhone Safari·Android Chrome 실기기 확인
- [ ] main 반영 후 GitHub Actions 배포 성공 확인
- [ ] 배포 페이지와 OG 미리보기 확인

CSS/JS/데이터 버전은 빌드에서 자동으로 내용 해시를 포함합니다. 사진도 내용 해시 파일명으로 생성합니다. 공유 미리보기 변경 시에는 새 이미지 파일명을 site.share_image에 지정하세요.
