/**
 * Prints how synthetic residents around Kochi split into neighbourhoods.
 * Run with: npm run synthetic -- 600
 * The data is fake and never touches the database.
 */
import { rebalance } from "../src/lib/hood/rebalance";
import { syntheticResidents } from "../src/lib/hood/synthetic";

const count = Number(process.argv[2] ?? 600);
const residents = syntheticResidents(count, 42);
const hoods = rebalance(residents);

const byRes = new Map<number, number[]>();
for (const h of hoods) {
  const sizes = byRes.get(h.resolution) ?? [];
  sizes.push(h.members.length);
  byRes.set(h.resolution, sizes);
}

console.log(`${count} synthetic residents -> ${hoods.length} neighbourhoods`);
for (const [res, sizes] of [...byRes.entries()].sort((a, b) => a[0] - b[0])) {
  const total = sizes.reduce((a, b) => a + b, 0);
  console.log(
    `  resolution ${res}: ${sizes.length} neighbourhoods, ${total} people, sizes ${Math.min(...sizes)} to ${Math.max(...sizes)}`,
  );
}
