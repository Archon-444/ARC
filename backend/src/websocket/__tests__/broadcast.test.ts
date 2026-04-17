import { broadcastTokenActivity, getRoomStats } from '..';

describe('broadcastTokenActivity', () => {
  it('is exported and does not throw when no clients are subscribed', () => {
    expect(() =>
      broadcastTokenActivity('0xAbCDef0000000000000000000000000000000001', {
        type: 'buy',
        amount: '100',
      }),
    ).not.toThrow();
  });

  it('keeps room stats empty when no clients have joined', () => {
    const stats = getRoomStats();
    expect(stats.totalClients).toBe(0);
    expect(stats.totalRooms).toBe(0);
  });
});
