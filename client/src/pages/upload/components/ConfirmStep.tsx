/**
 * Confirmation view shown after successful creation.
 */
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfirmStepProps {
  resourceCount: number;
  onUploadMore(): void;
  onViewResources(): void;
}

/**
 * Confirmation view shown after successful creation.
 */
export function ConfirmStep({
  resourceCount,
  onUploadMore,
  onViewResources,
}: ConfirmStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Success!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-green-600">
          {resourceCount > 1
            ? `${resourceCount} resources created successfully.`
            : 'Your resource has been created successfully.'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onUploadMore} className="flex-1">
            Upload More
          </Button>
          <Button onClick={onViewResources} className="flex-1">
            View Resources
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
