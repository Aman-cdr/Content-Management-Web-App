import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db.json');

const INITIAL_MEDIA = [
  { id: 1, name: "b-roll-coffee.mp4", type: "video", size: "12.4 MB", tags: ["vlog", "lifestyle"], color: "blue", createdAt: new Date().toISOString() },
  { id: 2, name: "thumbnail-bg.png", type: "image", size: "1.2 MB", tags: ["design", "gradient"], color: "purple", createdAt: new Date().toISOString() },
  { id: 3, name: "intro-music.wav", type: "audio", size: "4.5 MB", tags: ["audio", "upbeat"], color: "amber", createdAt: new Date().toISOString() },
  { id: 4, name: "logo-transparent.png", type: "image", size: "0.4 MB", tags: ["brand"], color: "emerald", createdAt: new Date().toISOString() },
  { id: 5, name: "setup-tour-raw.mov", type: "video", size: "1.2 GB", tags: ["raw"], color: "rose", createdAt: new Date().toISOString() },
  { id: 6, name: "interview-clip.mp4", type: "video", size: "45.2 MB", tags: ["interview"], color: "blue", createdAt: new Date().toISOString() },
  { id: 7, name: "background-texture.jpg", type: "image", size: "2.1 MB", tags: ["assets"], color: "purple", createdAt: new Date().toISOString() },
  { id: 8, name: "outro-theme.mp3", type: "audio", size: "3.2 MB", tags: ["audio"], color: "amber", createdAt: new Date().toISOString() },
];

async function getDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.media) {
      parsed.media = INITIAL_MEDIA;
      await fs.writeFile(dbPath, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      const newDb = { content: [], media: INITIAL_MEDIA };
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
    return NextResponse.json(db.media || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
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
    
    db.media.unshift(newItem);
    await saveDb(db);
    
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create media' }, { status: 500 });
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
    db.media = db.media.filter(item => item.id.toString() !== id.toString());
    await saveDb(db);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
