import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PerformancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Performance Review
        </h2>
        <p className="text-muted-foreground">
          Track your quality scores and productivity metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.5</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        {/* Placeholder for more cards */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History Score</CardTitle>
          <CardDescription>
            History of your completed tasks and their quality ratings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            Performance Chart / Table Placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
