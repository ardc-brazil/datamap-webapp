import fs from "fs";
import path from "path";
import { MANUAL_SEARCH_INDEX_FILE } from "../contants/ManualConstants";
import { readChapters, toChapter } from "../lib/manual";
import { buildSearchIndex } from "../lib/manualSearch";

const target = path.join(process.cwd(), MANUAL_SEARCH_INDEX_FILE);
const index = buildSearchIndex(readChapters().map(toChapter));

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(index));
console.log(`${MANUAL_SEARCH_INDEX_FILE}: ${index.length} entradas`);
