#!/usr/bin/env node

/**
 * Fetch a Jira ticket + parent/epic context via REST API.
 * Zero dependencies — uses built-in Node.js https module.
 * 
 * Usage:  node scripts/fetch-jira.js ES-1838
 * Output: tempAgentOutput/ticket-context-[TICKET-ID].md
 * 
 * Config: create .env.local in project root:
 *   JIRA_URL=https://your-org.atlassian.net
 *   JIRA_EMAIL=you@company.com
 *   JIRA_API_TOKEN=your-personal-api-token
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ── Load .env.local if exists ──────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .forEach((l) => {
      const [k, ...v] = l.split("=");
      if (k && v.length) process.env[k.trim()] = v.join("=").trim();
    });
}

const JIRA_URL = process.env.JIRA_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error("ERROR: Set JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN in .env.local or environment.");
  console.error("Example .env.local:");
  console.error("  JIRA_URL=https://your-org.atlassian.net");
  console.error("  JIRA_EMAIL=you@company.com");
  console.error("  JIRA_API_TOKEN=your-token");
  process.exit(1);
}

const ticketId = process.argv[2];
if (!ticketId) {
  console.error("Usage: node scripts/fetch-jira.js <TICKET-ID>");
  process.exit(1);
}

const AUTH = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");

// ── Fetch helper ────────────────────────────────────────────────────
function fetchIssue(issueKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(
      `/rest/api/3/issue/${issueKey}?fields=summary,description,issuetype,status,parent,labels,components,customfield_10014`,
      JIRA_URL
    );
    const client = url.protocol === "https:" ? https : http;

    const req = client.request(
      url,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${AUTH}`,
          Accept: "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 404) {
            reject(new Error(`Ticket ${issueKey} not found (404).`));
          } else if (res.statusCode === 401) {
            reject(new Error(`Auth failed (401). Check JIRA_EMAIL and JIRA_API_TOKEN.`));
          } else if (res.statusCode === 403) {
            reject(new Error(`No access to ${issueKey} (403). Check project permissions.`));
          } else if (res.statusCode >= 400) {
            reject(new Error(`Jira API ${res.statusCode}: ${data.slice(0, 300)}`));
          } else {
            resolve(JSON.parse(data));
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

// ── ADF to plain text ───────────────────────────────────────────────
function adfToText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.type === "text") return node.text || "";
  if (node.type === "hardBreak") return "\n";
  if (node.type === "paragraph")
    return (node.content || []).map(adfToText).join("") + "\n";
  if (node.type === "heading") {
    const prefix = "#".repeat(node.attrs?.level || 2);
    return `${prefix} ${(node.content || []).map(adfToText).join("")}\n`;
  }
  if (node.type === "bulletList")
    return (node.content || []).map((li) => `- ${adfToText(li)}`).join("");
  if (node.type === "orderedList")
    return (node.content || [])
      .map((li, i) => `${i + 1}. ${adfToText(li)}`)
      .join("");
  if (node.type === "listItem")
    return (node.content || []).map(adfToText).join("");
  if (node.type === "codeBlock")
    return "```\n" + (node.content || []).map(adfToText).join("") + "\n```\n";
  if (node.content) return node.content.map(adfToText).join("");
  return "";
}

function getDescription(fields) {
  if (!fields.description) return "(no description)";
  if (typeof fields.description === "string") return fields.description;
  return adfToText(fields.description);
}

// ── Build markdown ──────────────────────────────────────────────────
function buildMarkdown(issue, parentIssue, epicIssue) {
  const f = issue.fields;
  let md = `# Ticket Context — ${issue.key}\n\n`;

  if (epicIssue) {
    md += `## Epic: ${epicIssue.key} — ${epicIssue.fields.summary}\n\n`;
    md += `### ⛔ Global Constraints\n\n`;
    md += getDescription(epicIssue.fields) + "\n\n";
  }

  if (parentIssue && parentIssue.key !== epicIssue?.key) {
    md += `## Parent Task: ${parentIssue.key} — ${parentIssue.fields.summary}\n\n`;
    md += getDescription(parentIssue.fields) + "\n\n";
  }

  md += `## Current Ticket: ${issue.key} — ${f.summary}\n\n`;
  md += `| Field | Value |\n|---|---|\n`;
  md += `| Type | ${f.issuetype?.name || "?"} |\n`;
  md += `| Status | ${f.status?.name || "?"} |\n`;
  md += `| Components | ${(f.components || []).map((c) => c.name).join(", ") || "—"} |\n`;
  md += `| Labels | ${(f.labels || []).join(", ") || "—"} |\n\n`;

  md += `### Description\n\n${getDescription(f)}\n`;

  return md;
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(`Fetching ${ticketId}...`);
  const issue = await fetchIssue(ticketId);

  let parentIssue = null;
  let epicIssue = null;

  const parentRef = issue.fields.parent;
  if (parentRef?.key) {
    console.log(`Fetching parent ${parentRef.key}...`);
    parentIssue = await fetchIssue(parentRef.key);

    const grandparentRef = parentIssue.fields.parent;
    if (grandparentRef?.key) {
      console.log(`Fetching epic ${grandparentRef.key}...`);
      epicIssue = await fetchIssue(grandparentRef.key);
    }
  }

  if (!epicIssue && issue.fields.customfield_10014) {
    const epicKey = issue.fields.customfield_10014;
    if (typeof epicKey === "string" && epicKey.includes("-")) {
      console.log(`Fetching linked epic ${epicKey}...`);
      epicIssue = await fetchIssue(epicKey);
    }
  }

  const outDir = path.join(process.cwd(), "tempAgentOutput");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const md = buildMarkdown(issue, parentIssue, epicIssue);
  const outPath = path.join(outDir, `ticket-context-${issue.key}.md`);
  fs.writeFileSync(outPath, md, "utf8");

  console.log(`\nDone → tempAgentOutput/ticket-context-${issue.key}.md`);
  console.log(`\nTicket: ${issue.key} — ${issue.fields.summary}`);
  console.log(`Type:   ${issue.fields.issuetype?.name}`);
  if (parentIssue) console.log(`Parent: ${parentIssue.key} — ${parentIssue.fields.summary}`);
  if (epicIssue) console.log(`Epic:   ${epicIssue.key} — ${epicIssue.fields.summary}`);
}

main().catch((err) => {
  console.error(`\nERROR: ${err.message}`);
  process.exit(1);
});
