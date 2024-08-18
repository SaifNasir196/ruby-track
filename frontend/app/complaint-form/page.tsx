"use client";

function Page() {
  const complaintRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const [similarComplaints, setSimilarComplaints] = useState<any[]>([]);
  const { toast } = useToast();

  const apiUrl =
    process.env.NODE_ENV === "production"
      ? "https://backend-white-glitter-696.fly.dev/api/v1/questions"
      : "http://localhost:3001/api/v1/questions";

  const {
    mutate: handleCreateComplaint,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async () => {
      if (
        !complaintRef ||
        !complaintRef.current ||
        !complaintRef.current.value
      ) {
        throw new Error("Complaint cannot be empty");
      }

      const complaintText = complaintRef.current.value;

      // Fetch similar complaints and tag from your backend
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: complaintText }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch similar complaints");
      }

      const data = await response.json();
      setSimilarComplaints(data.results);

      const tag = data.tag; // Assuming your API returns the tag
      // console.log("data:", data);
      const summary = data.summary; // Generate or get summary here

      // Submit the complaint with tag and summary
      await createComplaint(complaintText, tag, summary);

      // Clear the input after submission
      complaintRef.current.value = "";
    },
    onError: (error) => {
      console.error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast({
        title: "Complaint submitted successfully",
        variant: "default",
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
                <p className="text-red-500 text-sm">{error?.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isPending}
              onClick={() => handleCreateComplaint()}
            >
              {isPending ? "Submitting..." : "Submit Complaint"}
            </Button>
          </div>
        </CardContent>
      </Card>
      {similarComplaints.length > 0 && (
        <>
          <h3 className="w-full max-w-2xl mx-auto text-lg font-semibold pt-4">
            Similar Complaints:
          </h3>
          {similarComplaints.map((complaint, index) => (
            <Card
              key={index}
              className="w-full max-w-2xl mx-auto bg-gray-50 border-none shadow-md h-auto"
            >
              <CardHeader>
                <CardTitle>{complaint.issue}</CardTitle>
                <CardDescription>{complaint.sub_issue}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{complaint.complaint_what_happened}</p>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </section>
  );
}

// Remove the extractData, extractIssue, extractSubIssue, and extractComplaintWhatHappened functions as they are no longer needed.

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
import { createComplaint } from "../actions/complaint";
import { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default Page;
