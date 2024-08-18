"use client";
import { useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function Page() {
  const complaintRef = useRef<HTMLTextAreaElement>(null);
  const [similarComplaints, setSimilarComplaints] = useState<any[]>([]); // Adjusted to any[] to accommodate complex objects
  const queryClient = useQueryClient();

  const {
    mutate: handleCreateComplaint,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async () => {
      if (!complaintRef.current?.value) return;
      const complaintText = complaintRef.current.value;

      const response = await fetch(
        "https://backend-white-glitter-696.fly.dev/api/v1/questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: complaintText }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch similar complaints");
      }

      const { result } = await response.json(); // Destructure to directly access the result property
      setSimilarComplaints(result.matches); // Assuming the API returns an object with a result property containing matches
      complaintRef.current.value = "";
    },
    onError: (error) => console.error(error),
    onSuccess: () => {
      alert("Complaint submitted successfully");
      // Correctly invalidate the query
      queryClient.invalidateQueries({
        queryKey: ["similarComplaints"],
      });
    },
  });

  return (
    <section className="w-full max-w-3xl mx-auto h-full pt-36 flex flex-col gap-4 relative pb-8">
      <Card className="w-full max-w-2xl mx-auto bg-gray-50 border-none shadow-md h-auto">
        <CardHeader>
          <CardTitle>Submit a Complaint</CardTitle>
          <CardDescription>
            Please fill out the form below to submit your complaint.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="complaint" className="mb-1">
                Complaint Details
              </Label>
              <Textarea
                ref={complaintRef}
                placeholder="Describe your complaint"
                className="border-none h-48"
              />
              {isError && (
                <p className="text-red-500 text-sm">{error.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isPending}
              onClick={() => handleCreateComplaint()}
            >
              Submit Complaint
            </Button>
          </div>
        </CardContent>
      </Card>
      {similarComplaints.map((complaint, index) => (
        <Card
          key={index}
          className="w-full max-w-2xl mx-auto bg-gray-50 border-none shadow-md h-auto"
        >
          <CardHeader>
            <CardTitle>{extractIssue(complaint.metadata.text)}</CardTitle>
            <CardDescription>
              {extractSubIssue(complaint.metadata.text)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <p className="text-sm">
                  {extractComplaintWhatHappened(complaint.metadata.text)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

export default Page;

function extractSubIssue(jsonString: string) {
  try {
    const obj = JSON.parse(jsonString);
    return obj.sub_issue || "No sub-issue found";
  } catch (error) {
    console.error("Error parsing JSON string:", error);
    return "Invalid data";
  }
}

function extractComplaintWhatHappened(jsonString: string) {
  try {
    const obj = JSON.parse(jsonString);
    return obj.complaint_what_happened || "No complaint details found";
  } catch (error) {
    console.error("Error parsing JSON string:", error);
    return "Invalid data";
  }
}

function extractIssue(jsonString: string) {
  try {
    const obj = JSON.parse(jsonString);
    return obj.issue || "No issue found";
  } catch (error) {
    console.error("Error parsing JSON string:", error);
    return "Invalid data";
  }
}
