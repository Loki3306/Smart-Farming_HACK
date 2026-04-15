require(dotenv).config();
const { Pool } = require(pg);

(async () => {
  const p = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    const r = await p.query(
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'messages'
      ORDER BY ordinal_position
    );
    console.log(SCHEMA_CHECK:);
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) {
    console.error(ERROR:, e.code, e.message);
  } finally {
    await p.end();
  }
})();
