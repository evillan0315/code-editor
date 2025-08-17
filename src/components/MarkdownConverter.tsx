// src/components/markdown-converter/MarkdownConverter.tsx

import React, { useState, FormEvent, ChangeEvent, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { OutputFormat } from '@/types/markdown';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const MarkdownConverter = () => {
  const [contentInput, setContentInput] = useState<string>('');

  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>(OutputFormat.HTML);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFormatChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFormat(event.target.value as OutputFormat);

    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const handleContentChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setContentInput(event.target.value);

    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      setErrorMessage(null);
      setSuccessMessage(null);

      if (!contentInput.trim()) {
        setErrorMessage('Please enter content to convert.');
        return;
      }

      setIsLoading(true);

      let apiUrl: string;
      let requestBody: { [key: string]: any };
      let responseType: 'arraybuffer' | 'blob' | 'json' | 'text' | 'stream';
      let outputFilenameBase = 'converted_document';
      let outputExtension: string;

      try {
        let response;

        switch (selectedFormat) {
          case OutputFormat.HTML:
            apiUrl = `${API_BASE_URL}/api/utils/to-html`;
            requestBody = { markdown: contentInput };
            responseType = 'text';
            outputExtension = 'html';
            response = await axios.post(apiUrl + `?filename=${outputFilenameBase}`, requestBody, {
              responseType,
            });
            break;

          case OutputFormat.DOCX:
            apiUrl = `${API_BASE_URL}/api/utils/markdown-to-docx`;
            requestBody = { content: contentInput };
            responseType = 'blob';
            outputExtension = 'docx';
            response = await axios.post(apiUrl + `?filename=${outputFilenameBase}`, requestBody, {
              responseType,
            });
            break;

          case OutputFormat.DOCX_FROM_HTML:
            apiUrl = `${API_BASE_URL}/api/utils/to-html`;
            requestBody = { markdown: contentInput };
            responseType = 'text';
            outputExtension = 'html';
            response = await axios.post(apiUrl + `?filename=${outputFilenameBase}`, requestBody, {
              responseType,
            });

            apiUrl = `${API_BASE_URL}/api/utils/html-to-docx`;
            requestBody = { html: response.data };
            responseType = 'blob';
            outputExtension = 'docx';
            response = await axios.post(apiUrl + `?filename=${outputFilenameBase}`, requestBody, {
              responseType,
            });
            break;

          case OutputFormat.PLAIN_TEXT:
            apiUrl = `${API_BASE_URL}/api/utils/markdown-to-plain-text`;
            requestBody = { content: contentInput };
            responseType = 'json';
            outputExtension = 'txt';
            response = await axios.post(apiUrl + `?filename=${outputFilenameBase}`, requestBody, {
              responseType,
            });
            break;

          case OutputFormat.JSON_AST:
            apiUrl = `${API_BASE_URL}/api/utils/to-json`;
            requestBody = { markdown: contentInput };
            responseType = 'json';
            outputExtension = 'json';
            response = await axios.post(apiUrl + `?filename=${outputFilenameBase}`, requestBody, {
              responseType,
            });
            break;

          default:
            throw new Error('Unsupported output format selected.');
        }

        let finalData;
        let contentType = response.headers['content-type'];
        let filename = `${outputFilenameBase}.${outputExtension}`;

        if (responseType === 'blob' || responseType === 'arraybuffer') {
          finalData = response.data;
          const contentDisposition = response.headers['content-disposition'];
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
            if (filenameMatch && filenameMatch[1]) {
              try {
                filename = decodeURIComponent(filenameMatch[1].replace(/^"|"$/g, ''));
              } catch (e) {
                console.warn(
                  'Failed to decode filename from Content-Disposition, using raw:',
                  filenameMatch[1] + e,
                );
                filename = filenameMatch[1].replace(/^"|"$/g, '');
              }
            }
          }

          const blob = new Blob([finalData], { type: contentType });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);

          setSuccessMessage(
            `Successfully converted to ${selectedFormat.toUpperCase()} and downloaded "${filename}".`,
          );
        } else if (responseType === 'text') {
          finalData = response.data;
          const blob = new Blob([finalData], {
            type: contentType || 'text/html',
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          setSuccessMessage(
            `Successfully converted to ${selectedFormat.toUpperCase()} and downloaded "${filename}".`,
          );
        } else if (responseType === 'json') {
          finalData = response.data;
          let fileContent: string;
          let fileType: string;

          if (selectedFormat === OutputFormat.PLAIN_TEXT) {
            fileContent = finalData.text || '';
            fileType = 'text/plain';
            filename = `${outputFilenameBase}.txt`;
          } else if (selectedFormat === OutputFormat.JSON_AST) {
            fileContent = JSON.stringify(finalData, null, 2);
            fileType = 'application/json';
            filename = `${outputFilenameBase}.json`;
          } else {
            throw new Error('Unhandled JSON response type for download logic.');
          }

          const blob = new Blob([fileContent], { type: fileType });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          setSuccessMessage(
            `Successfully converted to ${selectedFormat.toUpperCase()} and downloaded "${filename}".`,
          );
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                const errorText = reader.result as string;
                const errorData = JSON.parse(errorText);
                setErrorMessage(
                  `Conversion failed: ${errorData.message || errorData.error || `Status: ${error.response?.status}`}`,
                );
              } catch (jsonParseError) {
                setErrorMessage(
                  `Conversion failed: ${error.response.statusText || 'Server error (non-JSON Blob response)'}`,
                );
                console.error('Failed to parse error response Blob as JSON:', jsonParseError);
              }
            };
            reader.onerror = () => {
              setErrorMessage(`Conversion failed: Error reading error response Blob.`);
              console.error('FileReader error:', reader.error);
            };
            reader.readAsText(error.response.data);
          } else {
            setErrorMessage(
              `Conversion failed: ${error.response.data?.message || error.response.statusText || `Status: ${error.response?.status}`}`,
            );
          }
        } else if (error instanceof Error) {
          setErrorMessage(`An unexpected error occurred: ${error.message}`);
        } else {
          setErrorMessage('An unknown error occurred.');
        }
        console.error('Conversion error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [contentInput, selectedFormat],
  );

  return (
    <div className="min-h-screen p-8 flex flex-col items-center bg-gray-900 text-gray-100">
      <h1 className="text-4xl font-bold mb-8">Content Converter</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-4xl mb-8"
      >
        <div className="mb-6">
          <label htmlFor="contentInput" className="block text-sm font-bold mb-2">
            Enter Content:
            {}
            {selectedFormat === OutputFormat.DOCX_FROM_HTML
              ? ' (Markdown input recommended for this conversion, it will be converted to HTML first)'
              : ' (Markdown input recommended for this conversion)'}
          </label>
          <textarea
            id="contentInput"
            className="shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y min-h-[200px] font-mono text-sm"
            placeholder={
              selectedFormat === OutputFormat.DOCX_FROM_HTML
                ? 'Type your Markdown here (e.g., # Document Title)...'
                : 'Type your Markdown here (e.g., # Hello World)...'
            }
            value={contentInput}
            onChange={handleContentChange}
            disabled={isLoading}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">Choose Output Format:</label>
          <div className="flex gap-4 flex-wrap">
            {Object.values(OutputFormat).map((format) => (
              <label key={format} className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="form-radio text-blue-500 h-5 w-5 border-gray-600 bg-gray-700"
                  name="outputFormat"
                  value={format}
                  checked={selectedFormat === format}
                  onChange={handleFormatChange}
                  disabled={isLoading}
                />
                <span className="ml-2 uppercase">
                  {format.replace(/_/g, ' ')} {}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-200"
          disabled={isLoading}
        >
          {isLoading ? 'Converting...' : 'Convert Content'}
        </button>

        {errorMessage && (
          <p className="mt-4 text-red-500 text-sm font-medium" role="alert" aria-live="polite">
            Error: {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="mt-4 text-green-500 text-sm font-medium" role="status" aria-live="polite">
            {successMessage}
          </p>
        )}
      </form>

      {}
      {}
      {}
      {}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-4xl mt-8">
        <h2 className="text-2xl font-semibold mb-4">Markdown Preview</h2>
        <div className="prose max-w-none p-4 border border-gray-600 rounded overflow-auto min-h-[150px] max-h-[400px] bg-gray-700 text-gray-200">
          {contentInput ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentInput}</ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic">Your Markdown preview will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};
