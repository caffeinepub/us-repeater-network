import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle, LogIn, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { NewRepeater } from "../backend";
import RepeaterForm from "../components/RepeaterForm";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAddRepeater, useGetCallerUserProfile } from "../hooks/useQueries";

export default function SubmitRepeaterPage() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { mutateAsync: addRepeater } = useAddRepeater();
  const [submitted, setSubmitted] = useState(false);
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const submittedBy = userProfile?.callSign
    ? `${userProfile.name} (${userProfile.callSign})`
    : userProfile?.name ||
      `${identity?.getPrincipal().toString().slice(0, 10)}...` ||
      "Anonymous";

  const handleSubmit = async (data: NewRepeater) => {
    try {
      await addRepeater({ ...data, submittedBy });
      setSubmitted(true);
      toast.success("Repeater submitted successfully!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(
        error?.message || "Failed to submit repeater. Please try again.",
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Send className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-tech font-bold text-2xl text-foreground tracking-wide">
            Submit a Repeater
          </h1>
          <p className="text-sm text-muted-foreground">
            Contribute to the directory — submissions are reviewed before going
            live
          </p>
        </div>
      </div>

      {/* Success state */}
      {submitted ? (
        <div className="ham-card p-8 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h2 className="font-tech font-bold text-xl text-foreground">
              Submission Received!
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Your repeater has been submitted and is awaiting admin review. It
              will appear in the directory once approved.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setSubmitted(false)}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              Submit Another
            </Button>
            <Link to="/">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Back to Directory
              </Button>
            </Link>
          </div>
        </div>
      ) : !isAuthenticated ? (
        /* Login required */
        <div className="ham-card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="font-tech font-bold text-xl text-foreground">
              Login Required
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              You must be logged in to submit a repeater to the directory.
            </p>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-tech font-semibold"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Login to Submit
              </>
            )}
          </Button>
        </div>
      ) : (
        /* Form */
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Submissions are reviewed by our admin before appearing in the
              public directory. Please ensure all information is accurate.
            </p>
          </div>
          <RepeaterForm
            onSubmit={handleSubmit}
            isSubmitting={false}
            submittedBy={submittedBy}
          />
        </div>
      )}
    </div>
  );
}
