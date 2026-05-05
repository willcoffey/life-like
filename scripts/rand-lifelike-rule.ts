const BIRTH_RULE_DENSITY = .25;
const SURVIVE_RULE_DENSITY = .25;

const rules = Number(Deno.args[0]);
if (!Number.isFinite(rules)) {
  console.error("Usage: deno run rand-lifelike-rule.ts <number>");
  Deno.exit(1);
}

for (let i = 0; i < rules; i++) {
  let b = "";
  let s = "";
  for (let d = 0; d <= 8; d++) {
    if (Math.random() < BIRTH_RULE_DENSITY) b += d;
    if (Math.random() < SURVIVE_RULE_DENSITY) s += d;
  }
  console.log(`b${b}s${s}`);
}
