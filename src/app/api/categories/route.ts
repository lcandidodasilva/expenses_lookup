import { NextResponse } from 'next/server';
import { getCategories, addPattern, initializeCategories } from '@/utils/db';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { categoryName, pattern } = await request.json();
    const newPattern = await addPattern(categoryName, pattern);
    return NextResponse.json(newPattern);
  } catch (error) {
    console.error('Error adding pattern:', error);
    return NextResponse.json({ error: 'Failed to add pattern' }, { status: 500 });
  }
}

// Initialize categories endpoint
export async function PUT() {
  try {
    await initializeCategories();
    return NextResponse.json({ message: 'Categories initialized successfully' });
  } catch (error) {
    console.error('Error initializing categories:', error);
    return NextResponse.json({ error: 'Failed to initialize categories' }, { status: 500 });
  }
} 