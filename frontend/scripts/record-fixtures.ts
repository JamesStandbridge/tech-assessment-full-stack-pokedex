/**
 * Record responses of a running search API as typed test fixtures. Each file
 * ends with `satisfies <ContractType>`, so type checking rejects a fixture the
 * contract no longer describes.
 */
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.env["POKEDEX_API_URL"] ?? "http://127.0.0.1:8000";
const target = new URL("../src/test/recorded/", import.meta.url);
const LIMIT = "5";

interface Recording {
  readonly name: string;
  readonly path: string;
  readonly type: "SearchResponse" | "SuggestResponse" | "EntityDetail";
}

const searches: Readonly<Record<string, string>> = {
  bulbaSearch: "bulba",
  fastElectricSearch: "fast electric pokemon",
  sleepSearch: "put the opponent to sleep",
  rainTeamSearch: "rain team",
  sunTeamSearch: "sun team",
  legendarySearch: "legendary pokemon",
  psychicSearch: "psychic",
  emptySearch: "xyzzy",
  fastPokemonSearch: "fast pokemon",
};

const recordings: readonly Recording[] = [
  ...Object.entries(searches).map(([name, query]) => ({
    name,
    path: `/api/search?${new URLSearchParams({ q: query, limit: LIMIT }).toString()}`,
    type: "SearchResponse" as const,
  })),
  { name: "pikaSuggest", path: "/api/suggest?q=pika", type: "SuggestResponse" },
  { name: "pikachuDetail", path: "/api/entities/pokemon/pikachu", type: "EntityDetail" },
  { name: "staticDetail", path: "/api/entities/ability/static", type: "EntityDetail" },
];

async function record(recording: Recording): Promise<void> {
  const response = await fetch(new URL(recording.path, baseUrl));
  if (!response.ok) {
    throw new Error(`${recording.path} answered ${String(response.status)}.`);
  }
  const body: unknown = await response.json();
  const source = [
    `import type { ${recording.type} } from "../../api/contract";`,
    "",
    `export const ${recording.name} = ${JSON.stringify(body, null, 2)} satisfies ${recording.type};`,
    "",
  ].join("\n");
  await writeFile(new URL(`${recording.name}.ts`, target), source);
}

await mkdir(target, { recursive: true });
await Promise.all(recordings.map(record));
process.stdout.write(`Recorded ${String(recordings.length)} responses from ${baseUrl}.\n`);
