import fs from 'fs/promises';
import path from 'path';

const REPO = process.env.GITHUB_REPO || 'iiiaha/iiiahabooks';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN;

// Vercel 프로덕션에서는 GitHub 저장소가 데이터 저장소, 로컬 개발은 파일시스템
const useGitHub = !!TOKEN;

const headers = () => ({
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

async function ghGet(name) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/data/${encodeURIComponent(name)}?ref=${BRANCH}`,
    { headers: headers(), cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`GitHub GET ${name} failed: ${res.status}`);
  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf-8');
  return { data: JSON.parse(content), sha: json.sha };
}

async function ghPut(name, data, message, sha) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/data/${encodeURIComponent(name)}`,
    {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64'),
        sha,
        branch: BRANCH,
      }),
    }
  );
  return res;
}

function localPath(name) {
  return path.join(process.cwd(), 'data', name);
}

export async function readJson(name) {
  if (useGitHub) return (await ghGet(name)).data;
  return JSON.parse(await fs.readFile(localPath(name), 'utf-8'));
}

export async function writeJson(name, data, message) {
  if (!useGitHub) {
    await fs.writeFile(localPath(name), JSON.stringify(data, null, 2) + '\n', 'utf-8');
    return;
  }
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { sha } = await ghGet(name);
    const res = await ghPut(name, data, message, sha);
    if (res.ok) return;
    lastStatus = res.status;
    // 409/422: sha 충돌 — 다시 읽어서 재시도
    if (res.status !== 409 && res.status !== 422) break;
  }
  throw new Error(`GitHub PUT ${name} failed: ${lastStatus}`);
}

// 읽기 → 변형 → 쓰기 (동시 신청 충돌 시 재시도마다 새로 읽음)
export async function mutateJson(name, mutate, message) {
  if (!useGitHub) {
    const data = await readJson(name);
    const next = mutate(data);
    await writeJson(name, next, message);
    return next;
  }
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, sha } = await ghGet(name);
    const next = mutate(data);
    const res = await ghPut(name, next, message, sha);
    if (res.ok) return next;
    lastStatus = res.status;
    if (res.status !== 409 && res.status !== 422) break;
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  throw new Error(`GitHub mutate ${name} failed: ${lastStatus}`);
}
