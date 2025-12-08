import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TimelineItem from '@/models/TimelineItem';
import { requireAdmin } from '@/lib/require-admin';

export async function PATCH(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid items array' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update all items in a single transaction
    const updatePromises = items.map((item: { _id: string; order: number }) =>
      TimelineItem.findByIdAndUpdate(item._id, { order: item.order })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error reordering timeline items:', error);
    return NextResponse.json(
      { error: 'Failed to reorder timeline items', details: error.message },
      { status: 500 }
    );
  }
}
