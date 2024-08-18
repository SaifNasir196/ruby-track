"use client"

import { useState, useMemo, useRef } from "react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { deleteComplaint, getUserComplaints } from "@/app/actions/complaint"
import { useUser } from "@clerk/nextjs"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Trash } from "lucide-react"

type Complaint = {
    id: string
    content: string
    tag: string
    summary: string
    createdAt: string
}

export default function Component() {
    const queryClient = useQueryClient()
    const [query, setQuery] = useState('')

    const { isLoaded, isSignedIn } = useUser()

    const { data: complaints, isLoading, isError, error } = useQuery<Complaint[], Error>({
        queryKey: ['complaints'],
        queryFn: async () => {
            const response = await getUserComplaints()
            return JSON.parse(response).data
        },
        enabled: isLoaded && isSignedIn,
    })

    const { mutate: handleDleteComplaint, isPending, isError: deleteError } = useMutation({
        mutationFn: async (id: number) => {
            await deleteComplaint(id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] })
        }
    })


    const filteredComplaints = useMemo(() => {
        if (!complaints) return []
        return complaints.filter((complaint: Complaint) => {
            const searchLower = query.toLowerCase()
            console.log('searchLower', searchLower);
            return (
                complaint.content.toLowerCase().includes(searchLower || "") ||
                complaint.summary.toLowerCase().includes(searchLower || "") ||
                complaint.tag.toLowerCase().includes(searchLower || "")
            )
        })
    }, [complaints, query])

    if (!isLoaded || isLoading) (
        <div className='mt-20 mx-auto 2xl:mx-56 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 sm: gap-6'>
            {[...Array(6)].map((_, index) => <Skeleton key={index} className="w-80 h-64" />)}
        </div>
    )

    if (!isSignedIn)
        return <h1>Please sign in to view your forms.</h1>

    if (isError)
        return <div>Error loading forms: {error.message}</div>;

    // console.log('filteredComplaints', filteredComplaints);
    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Complaints</h1>
                <p className="text-muted-foreground">View and manage the complaints submitted by users.</p>
            </div>
            <div className="mb-8 flex items-center justify-between">
                {/* Search bar */}
                <div className='relative w-full '>
                    <Search size={24} className='absolute left-3 top-3 text-gray-400' />
                    <Input
                        value={query}
                        type='text'
                        placeholder='Search your forms'
                        className='w-full bg-transparent focus:outline-none pl-11 py-6 text-base rounded-md'
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>
            </div>


            <div className="space-y-4">
                {filteredComplaints?.map((complaint: Complaint) => (
                    <Card key={complaint.id}>
                        <CardHeader>
                            <CardTitle>{complaint.summary}</CardTitle>
                            <CardDescription>
                                <Badge variant="outline" className="mr-2">
                                    {complaint.tag}
                                </Badge>
                                <time dateTime={complaint.createdAt}>{new Date(complaint.createdAt).toLocaleDateString()}</time>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between gap-10">
                                <p>{complaint.content}</p>
                                <Button variant="outline" size="icon" className="" disabled={isPending} onClick={() => handleDleteComplaint(parseInt(complaint.id))}>
                                    <Trash size={18} />
                                </Button>

                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}