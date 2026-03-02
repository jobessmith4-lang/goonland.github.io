# Fictopedia — Encyclopedia of Fictional Wars

A static Wikipedia-style site for fictional wars, built for GitHub Pages hosting.

## Project Structure

```
/
├── index.html              Homepage — lists all wars with search & category filters
├── article.html            Article template — renders any JSON article
├── style.css               Aged-academic parchment styling
├── script.js               Routing, JSON loading, rendering, search
├── README.md               This file
│
├── articles/
│   ├── index.json                   Master article list (used by homepage)
│   ├── crimson-schism.json          Full sample: The Crimson Schism (1347–1361)
│   ├── the-pale-campaign.json       Sample: The Pale Campaign (1689–1693)
│   └── war-of-the-ember-coast.json  Sample: War of the Ember Coast (1812–1819)
│
└── images/                          Optional folder for maps/icons/flags
```

## Hosting on GitHub Pages

1. Push this folder to a GitHub repository (e.g. `username/fictopedia`)
2. Go to **Settings → Pages → Source → Deploy from a branch**
3. Select `main` branch, `/ (root)` folder
4. Your site will be live at `https://username.github.io/fictopedia/`

> **Note:** GitHub Pages serves static files from the same origin, which is required for the `fetch()` calls in `script.js` to load JSON articles. Opening `index.html` directly from your filesystem (`file://`) will block those fetches due to CORS. Use a local server during development (e.g. `python3 -m http.server 8080` or VS Code Live Server).

## Adding a New Article

### Step 1 — Create the JSON file

Create `/articles/your-war-id.json`. The `id` field must exactly match the filename (without `.json`).

Minimum structure:
```json
{
  "id": "your-war-id",
  "title": "The Name of Your War",
  "subtitle": "An Alternative Title",
  "years": "1200–1215",
  "category": "Medieval",
  "infobox": {
    "date": "Spring 1200 – Autumn 1215",
    "location": "The Kingdom of Somewhere",
    "result": "Victory for Side A",
    "belligerents": [
      { "side": "Side A", "members": ["Army of A"] },
      { "side": "Side B", "members": ["Army of B"] }
    ],
    "commanders": [
      { "side": "Side A", "leaders": [{ "name": "General X", "note": "" }] },
      { "side": "Side B", "leaders": [{ "name": "General Y", "note": "†" }] }
    ],
    "strength": [
      { "side": "Side A", "value": "~20,000" },
      { "side": "Side B", "value": "~15,000" }
    ],
    "casualties": [
      { "side": "Side A", "value": "~5,000" },
      { "side": "Side B", "value": "~9,000" }
    ]
  },
  "sections": [
    {
      "id": "background",
      "title": "Background",
      "content": "Your text here. Separate paragraphs with a blank line.\n\nSecond paragraph."
    },
    {
      "id": "references",
      "title": "References",
      "content": "",
      "references": [
        { "id": 1, "author": "Smith, J.", "title": "The War", "publisher": "Publisher", "year": "1900", "note": "" }
      ]
    }
  ]
}
```

Commander note field: use `"†"` for killed in action, `"captured"` for prisoners, or `""` for none.

### Step 2 — Add to the index

Add an entry to `/articles/index.json`:
```json
{
  "id": "your-war-id",
  "title": "The Name of Your War",
  "subtitle": "An Alternative Title",
  "years": "1200–1215",
  "summary": "A one-to-two sentence summary for the homepage card.",
  "belligerents": ["Side A", "Side B"],
  "result": "Victory for Side A",
  "casualties": "~14,000",
  "category": "Medieval"
}
```

### Step 3 — That's it

The article is now accessible at:
`article.html?id=your-war-id`

And will appear in the homepage index automatically.

## Supported Section Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Anchor ID for table of contents |
| `title` | string | Section heading |
| `content` | string | Body text; use `\n\n` to separate paragraphs |
| `subsections` | array | Optional sub-sections with `id`, `title`, `content` |
| `references` | array | Optional reference list |

## Categories

Current categories defined in `index.json`:
- `Medieval`
- `Early Modern`
- `Industrial Era`

Add any new category string and it will automatically appear as a filter tab on the homepage.

## Local Development

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code
# Install "Live Server" extension, right-click index.html → Open with Live Server
```

Then open `http://localhost:8080` in your browser.
