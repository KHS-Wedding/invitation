"""모바일 청첩장 설정 파일.

대부분의 수정은 이 파일에서만 하면 됩니다.
문자열은 작은따옴표 또는 큰따옴표 안에 입력하세요.
"""

WEDDING = {
    'site': {
        'title': '김현수 · 김현선 결혼합니다',
        'description': '2027년 10월 9일 토요일 오후 1시, 호텔 ICC',
        # GitHub Pages 배포 후 발급된 전체 URL을 입력하세요.
        # 예: https://아이디.github.io/wedding-invitation/
        'url': '',
        'draft_notice': '예식 일시와 장소는 변경될 수 있습니다.',
    },

    'couple': {
        'groom': '김현수',
        'bride': '김현선',
        # 예: '김○○ · 이○○의 장남' / 확정 전에는 빈 문자열 유지
        'groom_family': '',
        'bride_family': '',
    },

    'wedding': {
        # YYYY-MM-DD 형식을 유지하세요.
        'date': '2027-10-09',
        # 24시간제 HH:MM 형식을 유지하세요.
        'time': '13:00',
        'display_date': '2027년 10월 9일 토요일',
        'display_time': '오후 1시',
    },

    'invitation': {
        'title': '저희 두 사람, 결혼합니다',
        'lines': [
            '소중한 분들을 모시고',
            '새로운 시작을 함께하려 합니다.',
            '기쁜 날, 함께해 주시면 감사하겠습니다.',
        ],
    },

    'venue': {
        'name': '호텔 ICC',
        'hall': '',  # 예: '1층 크리스탈볼룸'
        'address': '대전광역시 유성구 엑스포로123번길 55 호텔ICC',
        'phone': '042-866-5100',
        'latitude': 36.377062716,
        'longitude': 127.392797164,

        # 예식장 변경 시 아래 링크와 장소 ID도 함께 수정하세요.
        'naver_place_url': 'https://naver.me/Gdym9dt3',
        'kakao_place_url': 'https://place.map.kakao.com/21086510',
        'kakao_place_id': '21086510',
    },

    # 현재 장소를 기준으로 넣은 임시 안내입니다.
    # 2027년 예식 확정 후 노선·정류장·주차 조건을 반드시 다시 확인하세요.
    'transport': {
        'draft_label': '임시 교통 안내',
        'items': [
            {
                'title': '버스',
                'lines': [
                    '스마트시티5단지 정류장 하차 후 도보 약 2분',
                    '대전컨벤션센터 정류장 하차 후 도보 약 5분',
                ],
            },
            {
                'title': '지하철',
                'lines': [
                    '대전 1호선 정부청사역에서 버스 또는 택시로 이동',
                    '예식 확정 후 추천 환승 노선을 다시 안내할 예정입니다.',
                ],
            },
            {
                'title': '기차',
                'lines': [
                    '대전역 또는 서대전역에서 택시·버스를 이용해 이동',
                    '교통 상황에 따라 이동 시간이 달라질 수 있습니다.',
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
        # 계좌번호를 입력한 뒤 True로 변경하면 화면에 표시됩니다.
        'show': False,
        'message': '축하의 마음을 전해주시는 모든 분께 감사드립니다.',
        'groom_side': [
            # {'relation': '신랑', 'bank': '○○은행', 'number': '000-0000-0000', 'holder': '김현수'},
        ],
        'bride_side': [
            # {'relation': '신부', 'bank': '○○은행', 'number': '000-0000-0000', 'holder': '김현선'},
        ],
    },

    'footer': {
        'message': '김현수 · 김현선 드림',
    },
}
