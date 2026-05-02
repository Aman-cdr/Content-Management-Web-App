import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db.json');

const INITIAL_SERIES = [
  { id: 1, name: "Next.js Masterclass", episodes: 12, completed: 4, type: "Course", createdAt: new Date().toISOString() },
  { id: 2, name: "Daily Tech News", episodes: 30, completed: 18, type: "Shorts", createdAt: new Date().toISOString() },
  { id: 3, name: "Build a CMS with AI", episodes: 5, completed: 1, type: "Project", createdAt: new Date().toISOString() },
];

async function getDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.series) {
      parsed.series = INITIAL_SERIES;
      await fs.writeFile(dbPath, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      const newDb = { content: [], media: [], series: INITIAL_SERIES };
      await fs.writeFile(dbPath, JSON.stringify(newDb, null, 2));
      return newDb;
    }
    throw error;
  }
}

async function saveDb(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json(db.series || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const db = await getDb();
    
    const newItem = {
      id: Date.now(),
      ...body,
      createdAt: new Date().toISOString()
    };
    
    db.series.unshift(newItem);
    await saveDb(db);
    
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create series' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const db = await getDb();
    db.series = db.series.filter(item => item.id.toString() !== id.toString());
    await saveDb(db);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete series' }, { status: 500 });
  }
}
