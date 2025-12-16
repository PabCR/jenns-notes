/**
 * Upload page orchestrates note, link, and PDF creation with multi-step UI.
 */
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TypeStep } from './components/TypeStep';
import { MultiReviewStep } from './components/MultiReviewStep';
import { ConfirmStep } from './components/ConfirmStep';
import { useUploadFlow } from './useUploadFlow';

/**
 * Upload entry point that wires shared state into step-specific components.
 */
export function UploadPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const upload = useUploadFlow(session);
  const { state } = upload;

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (files: File[]) => {
    upload.handleFileSelect(files);
    resetFileInput();
  };

  const handleReset = () => {
    upload.resetFlow();
    resetFileInput();
  };

  const handleBackToType = () => upload.setState({ step: 'type' });

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-4 md:p-8 pb-64">
      <div className="max-w-2xl mx-auto pb-32">
        <h1 className="text-3xl font-bold mb-8">Upload Resource</h1>

        {state.step === 'type' && (
          <TypeStep
            content={state.content}
            linkUrl={state.linkUrl}
            pendingPdfs={state.pendingPdfs}
            pendingResourcesCount={state.pendingResources.length}
            loading={state.loading}
            error={state.error}
            fileInputRef={fileInputRef}
            onContentChange={(value) => upload.setState({ content: value })}
            onLinkChange={(value) => {
              upload.setState({ linkUrl: value, error: '' });
            }}
            onAddNote={upload.handleAddNote}
            onAddLink={upload.handleAddLink}
            onFileSelect={handleFileSelect}
            onRemovePendingPdf={upload.handleRemovePendingPdf}
            onAddPdfs={upload.handleAddPdfs}
            onReviewClick={() => upload.setState({ step: 'review' })}
          />
        )}

        {state.step === 'review' && (
          <MultiReviewStep
            resources={state.pendingResources}
            tagInputs={state.pendingTagInputs}
            extractingIds={state.extractingIds}
            loading={state.loading}
            error={state.error}
            onBack={handleBackToType}
            onSubmit={upload.handleSubmitAll}
            onExtractAll={upload.handleExtractAllMetadata}
            onExtractForId={upload.handleExtractMetadataForId}
            onUpdateResource={upload.handleUpdateResource}
            onRemoveResource={upload.handleRemoveResource}
            onAddTag={upload.handleAddTagToResource}
            onRemoveTag={upload.handleRemoveTagFromResource}
            onTagInputChange={(id, value) =>
              upload.setState({
                pendingTagInputs: {
                  ...state.pendingTagInputs,
                  [id]: value,
                },
              })
            }
          />
        )}

        {state.step === 'confirm' && (
          <ConfirmStep
            resourceCount={state.confirmedResourceCount || 1}
            onUploadMore={handleReset}
            onViewResources={() => navigate('/')}
          />
        )}
      </div>
    </div>
  );
}

export { UploadPage as Upload };
