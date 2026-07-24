"""모바일 청첩장 설정 파일.

대부분의 수정은 이 파일에서만 하면 됩니다.
문자열은 작은따옴표 또는 큰따옴표 안에 입력하세요.
"""

WEDDING = {
    'site': {
        'title': '김현수 · 김현선 결혼합니다',
        'description': '2027년 10월 9일 토요일 오후 1시, 호텔 ICC 1층 크리스탈홀',
        # GitHub Pages 배포 주소
        'url': 'https://khs-wedding.github.io/invitation/',
        # 공유 서비스의 기존 캐시를 갱신하기 위한 주소입니다.
        'share_url': 'https://khs-wedding.github.io/invitation/?v=7',
        # 커버사진 대신 사용할 별도 공유 미리보기 이미지입니다.
        'share_image': 'static/share-preview-v7.png',
        'asset_version': '7',
        'draft_notice': '예식 일시와 장소는 변경될 수 있습니다.',
    },

    'design': {
        # 커버사진의 보이는 위치입니다. 두 번째 숫자를 낮추면 위쪽, 높이면 아래쪽이 더 보입니다.
        # 예: '50% 20%', '50% 50%', '50% 70%'
        'cover_position': '50% 35%',
        # 갤러리에서 처음 보여줄 사진 수입니다. 이후 사진은 '사진 더보기'로 펼칩니다.
        'gallery_initial_count': 6,
    },

    'couple': {
        'groom': '김현수',
        'bride': '김현선',
        'groom_family': '',
        'bride_family': '',
    },

    'wedding': {
        'date': '2027-10-09',
        'time': '13:00',
        'display_date': '2027년 10월 9일 토요일',
        'display_time': '오후 1시',
    },

    'invitation': {
        'title': '저희 두 사람, 결혼합니다.',
        'lines': [
            '소중한 분들을 모시고',
            '새로운 시작을 함께하려 합니다.',
            '기쁜 날, 함께해 주시면 감사하겠습니다.',
        ],
    },

    'venue': {
        'name': '호텔 ICC',
        'hall': '1층 크리스탈홀',
        'address': '대전광역시 유성구 엑스포로123번길 55 호텔ICC',
        'phone': '042-866-5100',
        'latitude': 36.377062716,
        'longitude': 127.392797164,
        'naver_place_url': 'https://naver.me/Gdym9dt3',
        'kakao_place_url': 'https://place.map.kakao.com/21086510',
        'kakao_place_id': '21086510',
    },

    # 예식 확정 후 노선·정류장·주차 조건을 다시 확인하세요.
    'transport': {
        'draft_label': '버스 안내',
        'items': [
            {
                'title': '버스',
                'lines': [
                    '스마트시티5단지 정류장 하차 후 도보 약 2분',
                    '대전컨벤션센터 정류장 하차 후 도보 약 5분',
                ],
            },
        ],
    },

    'parking': {
        'title': '주차 안내',
        'lines': [
            '호텔 ICC 주차장을 이용해 주세요.',
            '웨딩홀 공식 안내 기준 1,000대 이상 수용 가능하며, 예식 당일 주차요원이 안내합니다.',
        ],
    },

    'accounts': {
        'show': True,
        'message': '축하의 마음을 전해주시는 모든 분께 감사드립니다.',
        'groom_side': [
            {'relation': '신랑', 'bank': '카카오뱅크', 'number': '3333-04-1036106', 'holder': '김현수'},
        ],
        'bride_side': [
            {'relation': '신부', 'bank': '하나은행', 'number': '1234-1234', 'holder': '김현선'},
        ],
    },

    'footer': {
        'lines': [
            '함께해 주셔서 감사합니다.',
            '김현수 · 김현선 드림',
        ],
    },
}
