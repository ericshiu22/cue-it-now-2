import MinimalistChurnEmail from "@/components/emails/MinimalistChurnEmail";

const EmailPreview = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8">
      <h1 className="text-foreground text-lg font-semibold mb-2 tracking-wide">
        Email Template Preview
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        Subject: Cue It: Subscription Savings Opportunity
      </p>
      <div className="w-full max-w-[600px] rounded-lg overflow-hidden border border-border shadow-lg">
        <MinimalistChurnEmail
          userName="Alex"
          serviceName="Paramount+"
          monthlyCost="$18.99"
          showsWatched={0}
          showsCued={0}
          pauseUrl="https://example.com/pause"
          addShowUrl="https://example.com/queue"
        />
      </div>
    </div>
  );
};

export default EmailPreview;
