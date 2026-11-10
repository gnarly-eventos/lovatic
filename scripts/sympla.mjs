// Busca no Sympla os eventos da Lovatic Experience e grava eventos.json.
// Roda no GitHub (de hora em hora). Os tokens ficam nos "Secrets" do repositório:
//   SYMPLA_TOKEN_1  e  SYMPLA_TOKEN_2  (a Lovatic já teve datas nas duas contas)
// Se algo der errado, o eventos.json atual é mantido e a página continua no ar.
import { readFile, writeFile } from "node:fs/promises";

const ARQUIVO = new URL("../eventos.json", import.meta.url);
const tokens = [process.env.SYMPLA_TOKEN_1, process.env.SYMPLA_TOKEN_2].filter(t => t && t.trim());
const VERSOES = ["v1.6.0", "v1.5.1"];

const aviso = msg => console.log(`::warning::${msg}`);

if (!tokens.length) {
  aviso("Nenhum token do Sympla cadastrado. Mantendo o eventos.json atual.");
  process.exit(0);
}

const ontem = new Date(Date.now() - 864e5).toISOString().slice(0, 10) + " 00:00:00";

async function eventosDaConta(token, n) {
  for (const v of VERSOES) {
    const todos = [];
    let pagina = 1, ok = true;
    while (pagina <= 20) {
      const u = new URL(`https://api.sympla.com.br/public/${v}/events`);
      u.searchParams.set("from", ontem);
      u.searchParams.set("page_size", "200");
      u.searchParams.set("page", String(pagina));
      u.searchParams.set("field_sort", "start_date");
      u.searchParams.set("sort", "ASC");
      const r = await fetch(u, { headers: { s_token: token.trim(), accept: "application/json" } });
      if (!r.ok) { console.log(`Conta ${n}, API ${v}: HTTP ${r.status}`); ok = false; break; }
      const j = await r.json();
      todos.push(...(j.data || []));
      if (!j.pagination || !j.pagination.has_next) break;
      pagina++;
    }
    if (ok) { console.log(`Conta ${n}: ${todos.length} eventos (API ${v})`); return todos; }
  }
  throw new Error(`Não consegui ler a conta ${n} do Sympla. Confira o token.`);
}

const data = s => !s ? null : /T/.test(s) ? s : s.replace(" ", "T") + "-03:00";
const sim = v => v === true || v === 1 || v === "1" || v === "true";
const marca = nome => /lovatic/i.test(nome);

try {
  const brutos = [];
  for (const [i, t] of tokens.entries()) brutos.push(...await eventosDaConta(t, i + 1));
  const vistos = new Set();
  const eventos = brutos
    .map(e => ({
      id: String(e.id),
      nome: e.name || "",
      inicio: data(e.start_date),
      fim: data(e.end_date || e.start_date),
      publicado: sim(e.published),
      cancelado: sim(e.cancelled),
      cidade: (e.address && e.address.city) || "",
      local: (e.address && e.address.name) || "",
      link: e.url || ""
    }))
    .filter(e => marca(e.nome) && e.publicado && !e.cancelado && e.inicio)
    .filter(e => !vistos.has(e.id) && vistos.add(e.id))
    .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));

  const atual = JSON.parse(await readFile(ARQUIVO, "utf8").catch(() => "{}"));
  const mudou = JSON.stringify(atual.eventos || []) !== JSON.stringify(eventos);
  await writeFile(ARQUIVO, JSON.stringify({ atualizado_em: new Date().toISOString(), fonte: "sympla", eventos }, null, 1) + "\n");
  console.log(`${eventos.length} eventos da Lovatic gravados${mudou ? " (com mudanças)" : ""}.`);
  for (const e of eventos) console.log(`  ${e.inicio.slice(0, 16)} | ${e.cidade} | ${e.local} | id ${e.id} | ${e.link || "(sem link)"} | ${e.nome}`);
} catch (err) {
  aviso(`${err.message} Mantendo o eventos.json atual.`);
}
