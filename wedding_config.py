"""모바일 청첩장 설정 파일.

대부분의 수정은 이 파일에서만 하면 됩니다.
문자열은 작은따옴표 또는 큰따옴표 안에 입력하세요.
"""

WEDDING = {
    'site': {
        'title': '김현수 · 김현선 결혼합니다.',
        'description': '2027년 10월 30일 토요일 오후 1시 20분, 팔레드오페라 3층 트리아농홀',
        'url': 'https://khs-wedding.github.io/invitation/',
        'share_url': 'https://khs-wedding.github.io/invitation/',
        'share_image': 'static/share-preview-v15.png',
        'asset_version': '18',
        'draft_notice': '',
    },


    'analytics': {
        # Google Analytics 4 측정 ID를 입력하세요.
        # 예: 'G-ABC123DE45'
        # 아래 기본값을 실제 측정 ID로 바꾸기 전까지는 방문 통계가 전송되지 않습니다.
        'measurement_id': 'G-0ZT7S4GRH5',
        'enabled': True,
        'notice': '청첩장 이용 현황 확인을 위해 익명 방문 통계와 버튼 이용정보가 수집될 수 있습니다.',
    },

    'design': {
        'cover_position': '50% 35%',
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
        'date': '2027-10-30',
        'time': '13:20',
        'display_date': '2027년 10월 30일 토요일',
        'display_time': '오후 1시 20분',
        'display_fr': '',
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
        'name': '팔레드오페라',
        'name_fr': 'PALAIS de OPERA',
        'hall': '3층 트리아농홀',
        'hall_fr': '3F · SALLE TRIANON',
        'address': '대전광역시 서구 둔산남로 50',
        'phone': '042-300-5000',
        'latitude': None,
        'longitude': None,
        'naver_place_url': 'https://naver.me/xtgpraDu',
        'kakao_place_url': 'https://kko.to/cXTtRExWQI',
        'kakao_place_id': '',
    },

    'transport': {
        'draft_label': '교통 안내',
        'items': [
            {
                'title': '버스',
                'lines': [
                    '복합고속터미널 │ 승차시 │ 간선 105,106',
                    '정부청사터미널 │ 승차시 │ 간선 618',
                    '세종특별자치시 │ 승차시 │ 광역 M1',
                    '둔산초등학교 │ 하차시 │ 간선 618',
                    '대전고용센터 │ 하차시 │ 간선 105,706',
                    '대전광역시청 │ 하차시 │ 간선 104,106,213,617,703,707',
                ],
            },
            {
                'title': '지하철',
                'lines': [
                    '1호선 탄방역 2번, 3번 출구',
                    '1호선 시청역 1번 출구',
                ],
            },
            {
                'title': '자가용',
                'lines': [
                    '유성 I.C 또는 북대전 I.C 또는 대전 I.C 시청방면',
                    '대전시청 남문 앞',
                ],
            },
        ],
    },

    'parking': {
        'title': '주차 안내',
        'lines': [
            '팔레드오페라 주차타워를 이용하실 수 있습니다.',
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
