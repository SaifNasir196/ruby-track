"use server"

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';


// Create a new complaint
export async function createComplaint(complaint: string): Promise<any> {
    const { userId } = auth();
    console.log(typeof userId);
    if (!userId) return { error: 'User not authenticated' };

 
    console.log('complaint', complaint);

    const tag="tag"
    const summary="summary"


    if (!complaint) return { error: 'Content is required' };

    try {
        const complaintObj = await prisma.complaint.create({
            data: {
                userId: String(userId),
                content: complaint,
                tag,
                summary
            },
        });
        return { id:complaintObj.id };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to create complaint' }
    }
}

// Get all complaints for a user
export async function getUserComplaints(): Promise<NextResponse> {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });

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

        return NextResponse.json({ data: complaints }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
    }
}

// Delete a complaint
export async function deleteComplaint(formData: {complaintId: number}): Promise<NextResponse> {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });

    const { complaintId } = formData

    if (!complaintId || typeof complaintId !== 'string') {
        return NextResponse.json({ error: 'Invalid complaint ID' }, { status: 400 });
    }

    try {
        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
        }) 

        if (!complaint || complaint.userId !== userId) {
            return NextResponse.json({ error: 'Complaint not found or access denied' }, { status: 404 });
        }

        await prisma.complaint.delete({
            where: { id: complaintId },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
    }
}

// Read a single complaint
export async function getComplaint(formData: {complaintId: number}): Promise<NextResponse> {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });

    const {complaintId} = formData
    if (!complaintId || typeof complaintId !== 'string') {
        return NextResponse.json({ error: 'Invalid complaint ID' }, { status: 400 });
    }

    try {
        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
        });

        if (!complaint || complaint.userId !== userId) {
            return NextResponse.json({ error: 'Complaint not found or access denied' }, { status: 404 });
        }


        return NextResponse.json({ data: complaint }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 });
    }
}