import { Upload, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card className="border-dashed">
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <Bot className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">No Bots Hosted Yet</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Get started by uploading your first Discord bot. We'll handle the deployment,
          monitoring, and keep it running 24/7.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Upload className="h-4 w-4" />
          <span>Upload a .zip file containing your bot to begin</span>
        </div>
      </div>
    </Card>
  );
}
