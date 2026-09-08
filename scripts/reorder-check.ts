// Nightly reorder check — run via cron: 0 6 * * * npx tsx scripts/reorder-check.ts
import { runReorderCheck } from "../lib/reorder";

async function main() {
  console.log(`[${new Date().toISOString()}] Running reorder check…`);
  const result = await runReorderCheck();
  if (result.created === 0) {
    console.log("No reorder needed — all parts above reorder points.");
  } else {
    console.log(`Created ${result.created} draft PO(s):`);
    for (const po of result.pos) {
      console.log(`  ${po.po_number}  supplier=${po.supplier}  items=${po.items}`);
    }
  }
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
