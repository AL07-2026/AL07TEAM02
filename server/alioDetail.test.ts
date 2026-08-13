import { parseAlioRoleDetails } from './alioDetail.ts';

describe('parseAlioRoleDetails', () => {
  it('공고문에서 직무별 인원, 업무, 채용 배경을 추출한다', () => {
    const document = `
모집 분야 및 지원자격
간호사
1명
ㅇ약제부 근무
ㅇ항암조제 업무 보조 등
(필수) 간호사 면허 소지자
원무지원
1명
ㅇ원무과 근무
ㅇ원무 접수·수납
(우대) 병원 원무과 유경험자
근무조건 및 처우
계약기간 및 근무형태
간호사
약제부
임용일로부터 ~ 1년까지
※정규인력 충원 시 계약 종료될 수 있음
원무지원
원무과
임용일로부터 ~ 2027.2.26.까지
※원직자 복직 시 계약 종료될 수 있음
복리후생
`;
    const details = parseAlioRoleDetails(
      {
        steps: [
          { sortNo: 0, recrutPbancTtl: '간호사' },
          { sortNo: 1, recrutPbancTtl: '원무지원' },
        ],
      },
      document,
    );

    expect(details[0]).toMatchObject({
      name: '간호사',
      headcount: 1,
      department: '약제부',
      duties: ['항암조제 업무 보조 등'],
    });
    expect(details[0]?.hiringReason).toContain('정규인력이 충원되기 전');
    expect(details[1]?.hiringReason).toContain('기존 담당자의 부재 기간');
  });
});
