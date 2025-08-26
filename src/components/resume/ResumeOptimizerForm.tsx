// frontend/src/components/ResumeOptimizerForm.tsx
import React, { useState, useCallback } from 'react'; // Import useCallback
import { apiFetch, ApiError } from '@/services/apiFetch';
import { v4 as uuidv4 } from 'uuid';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useStore } from '@nanostores/react';
import { resumeConversationId } from '@/stores/resumeStore';

// --- DTO Interfaces for Frontend ---
interface OptimizationResultDto {
  optimizationScore: number;
  tailoredSummary: string;
  suggestions: {
    type: string;
    recommendation: string;
    details?: string[];
  }[];
  // Updated type for improvedResumeSection to match the JSON structure
  improvedResumeSection?: {
    title: string;
    content: string;
  };
  conversationId?: string;
}

interface GenerateResumeDto {
  prompt: string;
  systemInstruction?: string;
  conversationId?: string;
}

interface EnhanceResumeDto {
  resumeContent: string;
  sectionToEnhance?: string;
  enhancementGoal?: string;
  systemInstruction?: string;
  conversationId?: string;
}
// --- End DTO Interfaces ---

interface ResumeOptimizerFormProps {}

const ResumeOptimizerForm: React.FC<ResumeOptimizerFormProps> = () => {
  // Common States
  const [loading, setLoading] = useState<boolean>(false);
  const [parsingFile, setParsingFile] = useState<boolean>(false); // New state for file parsing
  const [error, setError] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<
    'optimize' | 'generate' | 'enhance'
  >('optimize');

  // Optimize Resume States
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResultDto | null>(null);

  // Generate Resume States
  const [generatePrompt, setGeneratePrompt] = useState<string>('');
  const [generateSystemInstruction, setGenerateSystemInstruction] =
    useState<string>('');
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);

  // Enhance Resume States
  const [enhanceResumeContent, setEnhanceResumeContent] = useState<string>('');
  const [enhanceSectionToEnhance, setEnhanceSectionToEnhance] =
    useState<string>('');
  const [enhanceGoal, setEnhanceGoal] = useState<string>('');
  const [enhanceSystemInstruction, setEnhanceSystemInstruction] =
    useState<string>('');
  const [enhancedResume, setEnhancedResume] = useState<string | null>(null);

  const $resumeConversationId = useStore(resumeConversationId);

  // Helper to reset states when switching modes
  const resetFormStates = () => {
    setError(null);
    setLoading(false);
    setParsingFile(false); // Reset parsing state
    // Optimization states
    setResumeFile(null);
    setResumeText('');
    setJobDescription('');
    setOptimizationResult(null);
    // Generation states
    setGeneratePrompt('');
    setGenerateSystemInstruction('');
    setGeneratedResume(null);
    // Enhancement states
    setEnhanceResumeContent('');
    setEnhanceSectionToEnhance('');
    setEnhanceGoal('');
    setEnhanceSystemInstruction('');
    setEnhancedResume(null);
  };

  // NEW: Handler for file input change to parse resume content
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files ? e.target.files[0] : null;

      setResumeFile(selectedFile);
      setResumeText(''); // Clear text area immediately
      setError(null); // Clear previous errors
      setOptimizationResult(null); // Clear previous optimization results

      if (!selectedFile) {
        return; // No file selected, just clear states
      }

      setParsingFile(true); // Indicate that file parsing is in progress

      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const parsedText = await apiFetch<string>('/api/resume/parse', {
          method: 'POST',
          body: formData,
          responseType: 'text',
          isFormData: true,
        });
        console.log(parsedText, 'parsedText');
        setResumeText(parsedText);
      } catch (err: unknown) {
        console.error('Error parsing resume file:', err);
        let errorMessage = 'Failed to extract text from file.';
        if (err instanceof ApiError) {
          errorMessage =
            err.details &&
            typeof err.details === 'object' &&
            (err.details as any).message
              ? (err.details as any).message
              : err.message || `API Error: Status ${err.status}`;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        setResumeFile(null); // Clear file state if parsing fails
        // Also clear the file input's value for proper re-selection
        const fileInput = document.getElementById(
          'optimize-resume-file-upload',
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } finally {
        setParsingFile(false); // Parsing finished
      }
    },
    [],
  ); // Empty dependency array as it doesn't depend on component state directly for its logic

  // Handler for Optimize Resume
  const handleOptimizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setOptimizationResult(null);

    // Prioritize resumeText, which will be populated from file parsing or direct paste
    if (!resumeText.trim()) {
      setError(
        'Resume content is required for optimization (either upload a file or paste text).',
      );
      setLoading(false);
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      setLoading(false);
      return;
    }
    let resumeConversationIdToUse = $resumeConversationId;
    if (!resumeConversationIdToUse) {
      const uuid = uuidv4();
      resumeConversationId.set(uuid);
      resumeConversationIdToUse = uuid;
    }

    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    formData.append('resumeContent', resumeText.trim()); // Always send resumeText now

    formData.append('conversationId', resumeConversationIdToUse);
    try {
      const result = await apiFetch<OptimizationResultDto>(
        '/api/resume/optimize-from-file',
        {
          method: 'POST',
          body: formData,
          isFormData: true,
        },
      );

      setOptimizationResult(result);
      if (result.conversationId) {
        resumeConversationId.set(result.conversationId);
      }
    } catch (err: unknown) {
      console.error('Error optimizing resume:', err);
      if (err instanceof ApiError) {
        let errorMessage = err.message || `API Error: Status ${err.status}`;
        if (
          err.details &&
          typeof err.details === 'object' &&
          (err.details as any).message
        ) {
          errorMessage = (err.details as any).message;
        }
        setError(errorMessage);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during optimization.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler for Generate Resume (no changes)
  const handleGenerateSubmit = async (e: React.FormEvent) => {
    /* ... existing code ... */
  };

  // Handler for Enhance Resume (no changes)
  const handleEnhanceSubmit = async (e: React.FormEvent) => {
    /* ... existing code ... */
  };

  return (
    <div className="flex flex-col h-full bg-dark text-gray-100">
      <div className="flex items-center justify-between px-1 py-0 border-b border-gray-700 bg-secondary shadow-xs">
        <div className={`flex gap-2 items-center justify-between`}>
          <Button className="p-0 m-0" variant="ghost">
            <Icon
              icon="mdi-light:console"
              width="1.7em"
              height="1.7em"
              className="text-blue-400"
            />
          </Button>
          <span className="text-sm font-semibold text-gray-300">
            Resume AI Assistant
          </span>
        </div>
        <div className="flex items-center gap-0">
          {/* Add more icons/buttons here if needed */}
        </div>
      </div>

      <div className="flex border-b border-gray-700 bg-white dark:bg-gray-800">
        <button
          className={`py-2 px-4 text-sm font-medium ${currentMode === 'optimize' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          onClick={() => {
            setCurrentMode('optimize');
            resetFormStates();
          }}
        >
          Optimize Resume
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${currentMode === 'generate' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          onClick={() => {
            setCurrentMode('generate');
            resetFormStates();
          }}
        >
          Generate Resume
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${currentMode === 'enhance' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          onClick={() => {
            setCurrentMode('enhance');
            resetFormStates();
          }}
        >
          Enhance Resume
        </button>
      </div>

      <div className="overflow-auto scroll-smooth flex-1 p-4">
        {(error || parsingFile) && (
          <p
            className={`text-sm mb-4 p-3 rounded-md ${error ? 'text-red-400 bg-red-900/20 border border-red-700' : 'text-blue-400 bg-blue-900/20 border border-blue-700'}`}
          >
            {parsingFile ? 'Parsing resume file, please wait...' : error}
          </p>
        )}
        {$resumeConversationId && (
          <p className="text-gray-400 text-sm mb-4">
            Current Session ID:{' '}
            <span className="font-mono text-xs dark:bg-gray-800 p-1 rounded break-all">
              {$resumeConversationId}
            </span>
          </p>
        )}

        {currentMode === 'optimize' && (
          <form
            onSubmit={handleOptimizeSubmit}
            className="max-w-3xl mx-auto border border-gray-700 shadow-md bg-secondary py-4 px-4 font-mono rounded-md"
          >
            <h2 className="text-xl font-semibold text-gray-100 mb-6">
              Optimize Your Resume
            </h2>
            <div className="mb-4">
              <label
                htmlFor="optimize-resume-text"
                className="block text-sm font-bold mb-2 text-gray-300"
              >
                Your Resume Content (from file or paste):
              </label>
              <textarea
                id="optimize-resume-text"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here, or upload a file below to extract its content."
                rows={15}
                required={!resumeText.trim()} // Required if text area is empty
                disabled={loading || parsingFile} // Disable while loading or parsing
                className="shadow appearance-none border border-gray-600 bg-gray-700 text-gray-100 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline resize-y focus:border-blue-500"
              ></textarea>
              <small className="text-gray-400 text-xs italic mt-2 block">
                The content extracted from your uploaded file will appear here.
                You can also paste directly.
              </small>
            </div>

            <div className="mb-4">
              <label
                htmlFor="optimize-resume-file-upload"
                className="block text-sm font-bold mb-2 text-gray-300"
              >
                Upload Resume File (PDF or DOCX):
              </label>
              <input
                type="file"
                id="optimize-resume-file-upload"
                name="resumeFile"
                accept=".pdf,.docx"
                onChange={handleFileChange} // Use the new handler here
                disabled={loading || parsingFile} // Disable while loading or parsing
                className="shadow appearance-none border border-gray-600 bg-gray-700 text-gray-100 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
              />
              {resumeFile && ( // Display selected file name and clear button
                <div className="p-3 bg-gray-700 rounded-md flex items-center justify-between mt-2">
                  <span className="text-gray-200 text-sm truncate">
                    {resumeFile.name}
                  </span>
                  <Button
                    type="button"
                    onClick={() => {
                      setResumeFile(null);
                      setResumeText(''); // Also clear text area
                      const fileInput = document.getElementById(
                        'optimize-resume-file-upload',
                      ) as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    variant="secondary"
                    size="sm"
                    className="ml-4 flex-shrink-0"
                  >
                    Clear File
                  </Button>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="job-description"
                className="block text-sm font-bold mb-2 text-gray-300"
              >
                Job Description:
              </label>
              <textarea
                id="job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here."
                rows={10}
                required
                disabled={loading || parsingFile}
                className="shadow appearance-none border border-gray-600 bg-gray-700 text-gray-100 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline resize-y focus:border-blue-500"
              ></textarea>
            </div>

            <Button
              type="submit"
              loading={loading || parsingFile} // Disable submit while parsing
              disabled={loading || parsingFile}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {loading
                ? 'Optimizing...'
                : parsingFile
                  ? 'Parsing File...'
                  : 'Get Optimization Suggestions'}
            </Button>

            {optimizationResult && (
              <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">
                  Optimization Results:
                </h3>
                <p className="text-gray-200 text-base mb-2">
                  <strong>Optimization Score:</strong>{' '}
                  <span className="font-semibold text-blue-400">
                    {optimizationResult.optimizationScore}%
                  </span>
                </p>
                <p className="text-gray-200 text-base mb-4">
                  <strong>Tailored Summary:</strong>{' '}
                  {optimizationResult.tailoredSummary}
                </p>

                <h4 className="text-lg font-semibold text-gray-100 mb-3">
                  Suggestions:
                </h4>
                {optimizationResult.suggestions.length > 0 ? (
                  <ul className="list-disc ml-5 space-y-2 text-gray-200 text-base">
                    {optimizationResult.suggestions.map((sug, index) => (
                      <li key={index}>
                        <strong className="font-medium">{sug.type}:</strong>{' '}
                        {sug.recommendation}
                        {sug.details && sug.details.length > 0 && (
                          <div className="bg-dark p-4 rounded-md overflow-x-auto text-sm font-mono mt-2 ">
                            {sug.details.map((detail, detIndex) => (
                              <div
                                key={detIndex}
                                className="my-2 text-gray-300"
                              >
                                {detail}
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-200 text-base">
                    No specific suggestions at this time.
                  </p>
                )}

                {optimizationResult.improvedResumeSection && (
                  <>
                    <h4 className="text-lg font-semibold text-gray-100 mt-6 mb-3">
                      {optimizationResult.improvedResumeSection.title} Example:
                    </h4>
                    <pre className="bg-primary p-4 rounded-md overflow-x-auto text-sm font-mono mt-2 whitespace-pre-wrap text-gray-100">
                      {optimizationResult.improvedResumeSection.content}
                    </pre>
                  </>
                )}
              </div>
            )}
          </form>
        )}

        {currentMode === 'generate' && (
          <form
            onSubmit={handleGenerateSubmit}
            className="max-w-3xl mx-auto border border-gray-700 shadow-md bg-secondary py-4 px-4 font-mono rounded-md"
          >
            <h2 className="text-xl font-semibold text-gray-100 mb-6">
              Generate New Resume
            </h2>
            <div className="mb-4">
              <label
                htmlFor="generate-prompt"
                className="block text-sm font-bold mb-2 text-gray-300"
              >
                Resume Generation Prompt:
              </label>
              <textarea
                id="generate-prompt"
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder="e.g., 'Generate a resume for a Full Stack Developer with 5 years experience in React, Node.js, and MongoDB. Highlight leadership skills and a strong portfolio. Include sections for Summary, Experience, Education, Skills, and Projects.'"
                rows={10}
                required
                disabled={loading}
                className="shadow appearance-none border border-gray-600 bg-gray-700 text-gray-100 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline resize-y focus:border-blue-500"
              ></textarea>
            </div>

            <div className="mb-4">
              <label
                htmlFor="generate-system-instruction"
                className="block text-sm font-bold mb-2 text-gray-300"
              >
                Optional System Instruction:
              </label>
              <textarea
                id="generate-system-instruction"
                value={generateSystemInstruction}
                onChange={(e) => setGenerateSystemInstruction(e.target.value)}
                placeholder="e.g., 'Ensure the resume is in Markdown format and focuses on quantifiable achievements. Do not include a contact section.'"
                rows={5}
                disabled={loading}
                className="shadow appearance-none border border-gray-600 bg-gray-700 text-gray-100 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline resize-y focus:border-blue-500"
              ></textarea>
              <small className="text-gray-400 text-xs italic mt-2 block">
                Advanced instruction to fine-tune AI behavior.
              </small>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {loading ? 'Generating...' : 'Generate Resume'}
            </Button>

            {generatedResume && (
              <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">
                  Generated Resume:
                </h3>
                <pre className="bg-primary p-4 rounded-md overflow-x-auto text-sm font-mono mt-2 whitespace-pre-wrap text-gray-100">
                  {generatedResume}
                </pre>
              </div>
            )}
          </form>
        )}

        {currentMode === 'enhance' && (
          <form
            onSubmit={handleEnhanceSubmit}
            className="max-w-3xl mx-auto border border-gray-700 shadow-md bg-secondary py-4 px-4 font-mono rounded-md"
          >
            <h2 className="text-xl font-semibold text-gray-100 mb-6">
              Enhance Existing Resume
            </h2>
            <div className="mb-4">
              <label
                htmlFor="enhance-resume-content"
                className="block text-sm font-bold mb-2 text-gray-300"
              >
                Resume Content to Enhance:
              </label>
              <textarea
                id="enhance-resume-content"
                value={enhanceResumeContent}
                onChange={(e) => setEnhanceResumeContent(e.target.value)}
                placeholder="Paste the resume content or section you want to enhance here."
                rows={15}
                required
                disabled={loading}
                className="shadow appearance-none border border-gray-600 bg-gray-700 text-gray-100 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline resize-y focus:border-blue-500"
              ></textarea>
            </div>

            <div className="mb-4">
              <label
                htmlFor="enhance-section-to-enhance"
                className="block text-sm font-bold mb-2 text-gray-300"
              >
                Optional: Specific Section to Enhance:
              </label>
              <input
                type="text"
                id="enhance-section-to-enhance"
                value={enhanceSectionToEnhance}
                onChange={(e) => setEnhanceSectionToEnhance(e.target.value)}
                placeholder="e.g., 'Summary', 'Experience', 'Skills'"
                disabled={loading}
                className="shadow appearance-none border border-gray-600 bg-gray-700 text-gray-100 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
              />
              <small className="text-gray-400 text-xs italic mt-2 block">
                Specify a section to focus the enhancement.
              </small>
            </div>

            <div className="mb-4">
              <label
                htmlFor="enhance-goal"
                className="block text-sm font-bold mb-2 text-gray-300"
              >
                Optional: Enhancement Goal:
              </label>
              <textarea
                id="enhance-goal"
                value={enhanceGoal}
                onChange={(e) => setEnhanceGoal(e.target.value)}
                placeholder="e.g., 'Make experience section more concise with stronger action verbs', 'Tailor summary for a leadership role'"
                rows={5}
                disabled={loading}
                className="shadow appearance-none border border-gray-600 bg-gray-700 text-gray-100 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline resize-y focus:border-blue-500"
              ></textarea>
              <small className="text-gray-400 text-xs italic mt-2 block">
                Provide a specific objective for the enhancement.
              </small>
            </div>

            <div className="mb-4">
              <label
                htmlFor="enhance-system-instruction"
                className="block text-sm font-bold mb-2 text-gray-300"
              >
                Optional System Instruction:
              </label>
              <textarea
                id="enhance-system-instruction"
                value={enhanceSystemInstruction}
                onChange={(e) => setEnhanceSystemInstruction(e.target.value)}
                placeholder="e.g., 'Ensure all dates are in MM/YYYY format. Do not use personal pronouns.'"
                rows={5}
                disabled={loading}
                className="shadow appearance-none border border-gray-600 bg-gray-700 text-gray-100 rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline resize-y focus:border-blue-500"
              ></textarea>
              <small className="text-gray-400 text-xs italic mt-2 block">
                Advanced instruction to fine-tune AI behavior.
              </small>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {loading ? 'Enhancing...' : 'Enhance Resume'}
            </Button>

            {enhancedResume && (
              <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">
                  Enhanced Resume:
                </h3>
                <pre className="bg-primary p-4 rounded-md overflow-x-auto text-sm font-mono mt-2 whitespace-pre-wrap text-gray-100">
                  {enhancedResume}
                </pre>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default ResumeOptimizerForm;
