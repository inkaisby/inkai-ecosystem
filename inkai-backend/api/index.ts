import app from '../src/index';

/** Dekatkan ke Supabase `ap-southeast-1`, kurangi masalah routing/TCP dari region jauh. */
export const config = {
  maxDuration: 60,
  regions: ['sin1'],
};

export default app;
