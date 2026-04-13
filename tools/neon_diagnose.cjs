require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const OUT = path.join(__dirname, 'neon_diag_output.json');
const MIGRATION = path.join(__dirname, '..', 'server', 'migrations', 'neon_create_farms.sql');

async function q(client, sql, params = []) {
  const res = await client.query(sql, params);
  return { rowCount: res.rowCount, rows: res.rows };
}

(async () => {
  const output = {
    timestamp: new Date().toISOString(),
    steps: {},
    errors: [],
  };

  const conn = process.env.NEON_DATABASE_URL;
  if (!conn) {
    output.errors.push({ step: 'env', error: 'NEON_DATABASE_URL missing' });
    fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
    process.exit(1);
  }

  const client = new Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    output.steps.session_identity = await q(
      client,
      'select current_database() as db, current_user as usr, current_schema() as current_schema'
    );

    output.steps.schemas = await q(
      client,
      'select schema_name from information_schema.schemata order by schema_name'
    );

    output.steps.tables_before = await q(
      client,
      "select table_schema, table_name from information_schema.tables where table_type = 'BASE TABLE' and table_schema not in ('pg_catalog','information_schema') order by table_schema, table_name"
    );

    output.steps.farm_relations_before = await q(
      client,
      "select n.nspname as schema, c.relname as relation, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname ilike '%farm%' and c.relkind in ('r','p','v','m') order by n.nspname, c.relname"
    );

    try {
      const pre = await client.query(
        'SELECT * FROM farms WHERE farmer_id = $1 ORDER BY created_at DESC',
        ['00000000-0000-0000-0000-000000000000']
      );
      output.steps.failing_query_before = {
        ok: true,
        rowCount: pre.rowCount,
      };
    } catch (e) {
      output.steps.failing_query_before = {
        ok: false,
        code: e.code,
        message: e.message,
      };
    }

    const migrationSql = fs.readFileSync(MIGRATION, 'utf8');
    await client.query(migrationSql);
    output.steps.migration = { applied: true, file: MIGRATION };

    output.steps.tables_after = await q(
      client,
      "select table_schema, table_name from information_schema.tables where table_type = 'BASE TABLE' and table_schema not in ('pg_catalog','information_schema') order by table_schema, table_name"
    );

    output.steps.farm_relations_after = await q(
      client,
      "select n.nspname as schema, c.relname as relation, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relname ilike '%farm%' and c.relkind in ('r','p','v','m') order by n.nspname, c.relname"
    );

    const post = await client.query(
      'SELECT * FROM farms WHERE farmer_id = $1 ORDER BY created_at DESC',
      ['00000000-0000-0000-0000-000000000000']
    );
    output.steps.failing_query_after = {
      ok: true,
      rowCount: post.rowCount,
    };
  } catch (e) {
    output.errors.push({ step: 'runtime', code: e.code, message: e.message });
  } finally {
    try {
      await client.end();
    } catch (e) {
      output.errors.push({ step: 'disconnect', message: e.message });
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
})();
