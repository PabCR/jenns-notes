/**
 * Upload page orchestrates note, link, and PDF creation with multi-step UI.
 */
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TypeStep } from './components/TypeStep';
import { SingleReviewStep } from './components/SingleReviewStep';
import { BatchReviewStep } from './components/BatchReviewStep';
import { ConfirmStep } from './components/ConfirmStep';
import { useUploadFlow } from './useUploadFlow';

/**
 * Upload entry point that wires shared state into step-specific components.
 */
export function UploadPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Resource</h1>

        {state.step === 'type' && (
          <TypeStep
            content={state.content}
            linkUrl={state.linkUrl}
            pendingPdfs={state.pendingPdfs}
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
          />
        )}

        {state.step === 'review' &&
          (state.pdfResources.length > 0 ? (
            <BatchReviewStep
              resources={state.pdfResources}
              tagInputs={state.pdfTagInputs}
              extractingIndexes={state.extractingPdfIndexes}
              loading={state.loading}
              error={state.error}
              onBack={handleBackToType}
              onSubmit={upload.handleBatchSubmit}
              onExtractAll={upload.handleExtractAllPdfMetadata}
              onExtractForIndex={upload.handleExtractPdfMetadataForIndex}
              onUpdateResource={upload.handleUpdatePdfResource}
              onRemoveResource={upload.handleRemovePdfResource}
              onAddTag={upload.handleAddTagToPdf}
              onRemoveTag={upload.handleRemoveTagFromPdf}
              onTagInputChange={(index, value) =>
                upload.setState({
                  pdfTagInputs: {
                    ...state.pdfTagInputs,
                    [index]: value,
                  },
                })
              }
            />
          ) : (
            <SingleReviewStep
              resourceType={state.resourceType}
              linkUrl={state.linkUrl}
              singlePdfFile={state.singlePdfFile}
              title={state.title}
              description={state.description}
              tags={state.tags}
              tagInput={state.tagInput}
              loading={state.loading}
              extracting={state.extracting}
              error={state.error}
              onTitleChange={(value) => upload.setState({ title: value })}
              onDescriptionChange={(value) => upload.setState({ description: value })}
              onTagInputChange={(value) => upload.setState({ tagInput: value })}
              onAddTag={upload.handleAddTag}
              onRemoveTag={upload.handleRemoveTag}
              onExtractMetadata={upload.handleExtractMetadata}
              onExtractPdfMetadata={upload.handleExtractPdfMetadata}
              onBack={handleBackToType}
              onReset={handleReset}
              onSubmit={upload.handleSubmit}
            />
          ))}

        {state.step === 'confirm' && (
          <ConfirmStep
            resourceCount={state.pdfResources.length || 1}
            onUploadMore={handleReset}
            onViewResources={() => navigate('/')}
          />
        )}
      </div>
    </div>
  );
}

export { UploadPage as Upload };
