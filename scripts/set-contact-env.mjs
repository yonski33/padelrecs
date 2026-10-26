// Sets the contact form's RESEND_API_KEY and CONTACT_TO (Production) on every Recs Vercel project listed in
// deployment/targets.json, without a Vercel team or the Vercel CLI. Asks for a Vercel access token
// (vercel.com/account/tokens) and the Resend key without echoing them; nothing secret is printed or saved.
// Existing values are replaced (upsert). New deployments pick the values up; already-running ones do not.
//   node scripts/set-contact-env.mjs
import { readFile } from "node:fs/promises";
import readline from "node:readline";

function ask(question, hidden = false) {
 return new Promise(resolve => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) { process.stdout.write(question); rl._writeToOutput = () => {}; }
  rl.question(hidden ? "" : question, answer => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(answer.trim()); });
 });
}

const { vercelProjects } = JSON.parse(await readFile(new URL("../deployment/targets.json", import.meta.url), "utf8"));
const token = await ask("Vercel access token: ", true);
const resendKey = await ask("Resend API key: ", true);
const contactTo = (await ask("Contact inbox [hello@redrecs.com]: ")) || "hello@redrecs.com";
if (!token || !resendKey) { console.error("Both the Vercel token and the Resend key are required."); process.exit(1); }

const vars = [
 { key: "RESEND_API_KEY", value: resendKey, type: "sensitive", target: ["production"] },
 { key: "CONTACT_TO", value: contactTo, type: "encrypted", target: ["production"] },
];
let failed = 0;
for (const [niche, project] of Object.entries(vercelProjects)) {
 for (const variable of vars) {
  const response = await fetch(`https://api.vercel.com/v10/projects/${project.id}/env?upsert=true`, {
   method: "POST",
   headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
   body: JSON.stringify(variable),
  });
  if (response.ok) console.log(`✓ ${project.name} ${variable.key}`);
  else { failed++; const body = await response.json().catch(() => ({})); console.error(`✗ ${project.name} (${niche}) ${variable.key}: ${response.status} ${body.error?.message || ""}`); }
 }
}
console.log(failed ? `${failed} failed.` : `Done: ${Object.keys(vercelProjects).length} projects.`);
process.exit(failed ? 1 : 0);
