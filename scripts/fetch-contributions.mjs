import fs from "node:fs/promises";
import path from "node:path";

const token = process.env.GH_CONTRIB_TOKEN;
const username = process.env.GITHUB_USERNAME || "paulot123";

if (!token) {
    throw new Error("Missing GH_CONTRIB_TOKEN. Add it as a repository secret.");
}

function isoDate(date) {
    return date.toISOString().slice(0, 10);
}

async function fetchContributions(from, to) {
    const query = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "paulot123-contributions-sync"
        },
        body: JSON.stringify({
            query,
            variables: {
                username,
                from: from.toISOString(),
                to: to.toISOString()
            }
        })
    });

    if (!response.ok) {
        throw new Error(`GitHub GraphQL request failed with ${response.status}`);
    }

    const body = await response.json();
    if (body.errors && body.errors.length) {
        throw new Error(`GitHub GraphQL error: ${body.errors[0].message}`);
    }

    const days = body?.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
    const counts = {};
    for (const week of days) {
        for (const day of week.contributionDays) {
            counts[day.date] = Number(day.contributionCount) || 0;
        }
    }
    return counts;
}

function yearRange(year) {
    return {
        from: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
        to: new Date(Date.UTC(year, 11, 31, 23, 59, 59))
    };
}

function last365Range() {
    const to = new Date();
    const from = new Date(to);
    from.setDate(to.getDate() - 364);
    return { from, to };
}

async function main() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const periods = {};

    const { from: lastFrom, to: lastTo } = last365Range();
    periods.last = { counts: await fetchContributions(lastFrom, lastTo) };

    for (let year = currentYear; year >= 2022; year -= 1) {
        const { from, to } = yearRange(year);
        periods[String(year)] = { counts: await fetchContributions(from, to) };
    }

    const payload = {
        generatedAt: new Date().toISOString(),
        username,
        periods
    };

    const outputPath = path.resolve("data", "github-contributions.json");
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
    console.log(`Wrote contribution data to ${outputPath}`);
    console.log(`Last 365 days commits: ${Object.values(periods.last.counts).reduce((a, b) => a + b, 0)}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
