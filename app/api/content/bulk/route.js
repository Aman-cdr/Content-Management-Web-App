import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db.json');

async function getDbData() {
  try {
    const fileContents = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    return { content: [] };
  }
}

async function saveDbData(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

// Bulk DELETE
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'IDs array is required' }, { status: 400 });
    }

    const data = await getDbData();
    data.content = data.content.filter(c => !ids.includes(c.id));
    await saveDbData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to bulk delete content' }, { status: 500 });
  }
}

// Bulk PATCH (Update)
export async function PATCH(request) {
  try {
    const { ids, updates } = await request.json();
    if (!ids || !Array.isArray(ids) || !updates) {
      return NextResponse.json({ error: 'IDs and updates are required' }, { status: 400 });
    }

    const data = await getDbData();
    const updatedItems = [];

    data.content = data.content.map(item => {
      if (ids.includes(item.id)) {
        const newItem = { ...item, ...updates };
        updatedItems.push(newItem);
        return newItem;
      }
      return item;
    });

    await saveDbData(data);
    return NextResponse.json(updatedItems);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to bulk update content' }, { status: 500 });
  }
}
