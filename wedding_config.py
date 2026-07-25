"""모바일 청첩장 설정 파일.

대부분의 수정은 이 파일에서만 하면 됩니다.
문자열은 작은따옴표 또는 큰따옴표 안에 입력하세요.
"""

WEDDING = {
    'site': {
        'title': '김현수 · 김현선 결혼합니다.',
        'description': '2027년 10월 9일 토요일 오후 1시, 호텔 ICC 1층 크리스탈홀',
        # GitHub Pages 배포 주소
        'url': 'https://khs-wedding.github.io/invitation/',
        # 공유 서비스의 기존 캐시를 갱신하기 위한 주소입니다.
        'share_url': 'https://khs-wedding.github.io/invitation/',
        # 커버사진 대신 사용할 별도 공유 미리보기 이미지입니다.
        'share_image': 'static/share-preview-v8.png',
        'asset_version': '16',
        'draft_notice': '',
    },

    'design': {
        # 커버사진의 보이는 위치입니다. 두 번째 숫자를 낮추면 위쪽, 높이면 아래쪽이 더 보입니다.
        # 예: '50% 20%', '50% 50%', '50% 70%'
        'cover_position': '50% 35%',
        # 갤러리에서 처음 보여줄 사진 수입니다. 이후 사진은 '사진 더보기'로 펼칩니다.
        'gallery_initial_count': 9,
    },

    'couple': {
        'groom': '김현수',
        'bride': '김현선',
        'groom_family': '',
        'bride_family': '',
    },

    'wedding': {
        'section_title': '예식 안내',
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

    # 예식 확정 후 교통 소요시간과 버스 노선을 다시 확인하세요.
    'transport': {
        'draft_label': '오시는 길',
        'items': [
            {
                'title': '기차',
                'lines': [
                    '대전역: 택시 20분 │ 버스 705번 50분',
                    '서대전역: 택시 15분 │ 버스 618번 50분',
                ],
            },
            {
                'title': '고속·시외버스',
                'lines': [
                    '대전복합터미널: 택시 20분',
                    '대전청사고속버스둔산정류소: 택시 10분 │ 버스 911번 20분',
                    '대전청사시외버스둔산정류소: 택시 10분 │ 버스 618번 20분',
                    '유성금호고속터미널: 택시 10분',
                    '유성시외버스정류소: 택시 15분 │ 버스 121번 45분',
                ],
            },
        ],
    },

    'parking': {
        'title': '주차 안내',
        'lines': [
            '호텔 ICC 지상 및 지하 주차장을 이용하실 수 있습니다.',
            '예식 당일 주차장이 다소 혼잡할 수 있는 점 너른 양해 부탁드립니다.',
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
