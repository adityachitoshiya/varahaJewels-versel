// Blog articles live as JSON files in data/blogs/ and are read at build time
// (getStaticProps), so every article is a static, crawlable HTML page.
// Server-only: import from getStaticProps / getStaticPaths, not from components.
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'data', 'blogs');

export const BLOG_CATEGORIES = ['Bridal', 'Craft & materials', 'Silver', 'Spiritual', 'Styling & gifting'];

function readAll() {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const post = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
        return post.slug && post.title && Array.isArray(post.sections) ? post : null;
      } catch {
        return null; // a broken file must not break the whole build
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title));
}

// List view: no body text, keeps the page small
export function getAllPostSummaries() {
  return readAll().map(({ slug, title, description, category, date, readMinutes }) => ({
    slug, title, description: description || '', category: category || 'Guides', date: date || null, readMinutes: readMinutes || 5,
  }));
}

export function getPost(slug) {
  return readAll().find((p) => p.slug === slug) || null;
}

export function getRelatedPosts(post, limit = 3) {
  return getAllPostSummaries().filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, limit);
}
