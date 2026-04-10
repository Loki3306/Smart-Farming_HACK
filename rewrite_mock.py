import re
import sys

def process():
    try:
        with open('server/routes/learn.ts', 'r', encoding='utf-8') as f:
            content = f.read()

        mock_def = """
class MockQuery implements PromiseLike<any> {
  table: string;
  selects: string = '*';
  whereCol: string | null = null;
  whereVal: any = null;
  whereOr: string | null = null;
  orderCol: string | null = null;
  orderAsc: boolean = true;
  limitNum: number | null = null;
  offsetNum: number | null = null;
  isSingle: boolean = false;
  isMaybeSingle: boolean = false;
  inserts: any = null;
  updates: any = null;
  deletes: boolean = false;
  eqMap: Record<string, any> = {};
  
  constructor(table: string) { this.table = table; }
  
  select(cols: string = '*') { this.selects = cols; return this; }
  eq(col: string, val: any) { this.eqMap[col] = val; return this; }
  or(clause: string) { this.whereOr = clause; return this; }
  in(...args: any[]) { return this; }
  is(...args: any[]) { return this; }
  ilike(...args: any[]) { return this; }
  contains(...args: any[]) { return this; }
  throwOnError(...args: any[]) { return this; }
  
  order(col: string, opts: { ascending?: boolean } = {}) { this.orderCol = col; this.orderAsc = opts.ascending !== false; return this; }
  limit(n: number) { this.limitNum = n; return this; }
  range(start: number, end: number) { this.offsetNum = start; this.limitNum = end - start + 1; return this; }
  single() { this.isSingle = true; return this; }
  maybeSingle() { this.isMaybeSingle = true; return this; }
  insert(data: any) { this.inserts = data; return this; }
  update(data: any) { this.updates = data; return this; }
  delete() { this.deletes = true; return this; }
  upsert(data: any, opts?: any) { this.inserts = data; this.updates = data; return this; }
  
  then<TResult1 = any, TResult2 = never>(
        onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                // Return dummy data structure so TypeErrors don't crash the compiler
                if (this.inserts) { resolve({ data: Array.isArray(this.inserts)? this.inserts : [this.inserts], error: null }); return; }
                if (this.updates) { resolve({ data: [this.updates], error: null }); return; }
                if (this.deletes) { resolve({ data: null, error: null }); return; }
                
                // Real data will come from raw SQL implementation, 
                // this is a fallback for compilation typing if not migrated yet
                resolve({ data: this.isSingle ? {} : [], error: null });
            } catch(e) { resolve({ data: null, error: e }); }
        }).then(onfulfilled, onrejected);
  }
}
"""
        
        content = re.sub(r'class MockQuery \{.*?async then\(resolve: any, reject: any\) \{.*?\}\s*\}', mock_def, content, flags=re.DOTALL)
        
        with open('server/routes/learn.ts', 'w', encoding='utf-8') as f:
            f.write(content)
            
        print("Successfully rebuilt MockQuery in learn.ts")
    except Exception as e:
        print(f"Error: {e}")

process()
