import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Path to our temporary JSON database
const dbPath = path.join(process.cwd(), 'db.json');

// Helper to read the database
async function getDbData() {
  try {
    const fileContents = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    // If file doesn't exist or is corrupted, return empty default
    return { content: [] };
  }
}

// Helper to write to the database
async function saveDbData(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

// GET all content
export async function GET() {
  try {
    const data = await getDbData();
    return NextResponse.json(data.content);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

// POST new content
export async function POST(request) {
  try {
    const newItem = await request.json();
    const data = await getDbData();
    
    // Add default fields
    const contentToSave = {
      ...newItem,
      id: newItem.id || `content-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: newItem.createdAt || new Date().toISOString(),
    };
    
    data.content = [contentToSave, ...data.content];
    await saveDbData(data);
    
    return NextResponse.json(contentToSave, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}

// PUT to update content
export async function PUT(request) {
  try {
    const updatedItem = await request.json();
    const data = await getDbData();
    
    const index = data.content.findIndex(c => c.id === updatedItem.id);
    if (index !== -1) {
      data.content[index] = { ...data.content[index], ...updatedItem };
      await saveDbData(data);
      return NextResponse.json(data.content[index]);
    }
    
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

// DELETE content
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const data = await getDbData();
    data.content = data.content.filter(c => c.id !== id);
    await saveDbData(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}
