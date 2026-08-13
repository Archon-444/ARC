import { CONNECTED_SURFACES, HERO_KPIS, READINESS_ITEMS } from '../home';

describe('home product copy', () => {
  it('leads with the creator paycheck, live curve, and cannot-rug claims', () => {
    expect(HERO_KPIS.map((item) => item.label)).toEqual([
      'Creator paycheck',
      'Live curve',
      'Cannot-rug',
    ]);
  });

  it('only features launch and token discovery as primary surfaces', () => {
    expect(CONNECTED_SURFACES.map((item) => item.href)).toEqual([
      '/launch',
      '/explore?tab=tokens',
    ]);
  });

  it('describes the launch → share → trade → get paid ritual', () => {
    expect(READINESS_ITEMS.map((item) => item.title)).toEqual([
      'Launch',
      'Share',
      'Trade',
      'Get paid',
    ]);
  });
});
