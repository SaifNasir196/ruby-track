"use server";

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Create a new complaint
export async function createComplaint(
  complaint: string,
  tag: string,
  summary: string
): Promise<any> {
  const { userId } = auth();
  if (!userId) throw new Error('Please sign in to submit complaint');

  if (!complaint) throw new Error('Complaint cannot be empty');

  try {
    const complaintObj = await prisma.complaint.create({
      data: {
        userId: String(userId),
        content: complaint,
        tag,
        summary,
      },
    });
    return { id: complaintObj.id };
  } catch (error) {
    console.error(error);
    throw new Error('Failed to create complaint, please try again later');
  }
}

// Get all complaints for a user
export async function getUserComplaints(): Promise<any> {
    const { userId } = auth();
    if (!userId) throw new Error('User not authenticated');

    try {
        const complaints = await prisma.complaint.findMany({
            where: { userId: userId },
            select: {
                id: true,
                content: true,
                tag: true,
                summary: true,
                createdAt: true,
            },
        });

        // Convert Date objects to ISO strings
        const serializedComplaints = complaints.map(complaint => ({
            ...complaint,
            createdAt: complaint.createdAt.toISOString(),
        }));

        // console.log('serializedComplaints', serializedComplaints);

        return JSON.stringify({ data: serializedComplaints });
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch complaints');
    }
}


// Delete a complaint
export async function deleteComplaint(complaintId: number): Promise<any> {
    const { userId } = auth();
    if (!userId) throw new Error('User not authenticated');

    if (!complaintId) {
        throw new Error('Invalid complaint ID');
    }

    try {
        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
        }) 

        if (!complaint || complaint.userId !== userId) {
            throw new Error('Complaint not found or access denied');
        }

        await prisma.complaint.delete({
            where: { id: complaintId },
        });

        console.log('Complaint deleted successfully');
        return { success: true };
    } catch (error) {
        console.error(error);
        throw new Error('Failed to delete complaint');
    }
}

// Read a single complaint
// export async function getComplaint(formData: {complaintId: number}): Promise<NextResponse> {
//     const { userId } = auth();
//     if (!userId) return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });

//     const {complaintId} = formData
//     if (!complaintId || typeof complaintId !== 'string') {
//         return NextResponse.json({ error: 'Invalid complaint ID' }, { status: 400 });
//     }

//     try {
//         const complaint = await prisma.complaint.findUnique({
//             where: { id: complaintId },
//         });

//         if (!complaint || complaint.userId !== userId) {
//             return NextResponse.json({ error: 'Complaint not found or access denied' }, { status: 404 });
//         }


//         return NextResponse.json({ data: complaint }, { status: 200 });
//     } catch (error) {
//         console.error(error);
//         return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 });
//     }
// }