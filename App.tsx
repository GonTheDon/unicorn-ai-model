
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { Spinner } from './components/Spinner';
import { editImageWithDesign } from './services/geminiService';
import { GenerationResult } from './types';

const DEFAULT_PROMPT = `You are a precise and expert photo editor. Your task is to perform a targeted texture replacement.

**Images provided:**
1. 'Base Image': This contains the original scene with one or more cushions.
2. 'Design Image': This contains a fabric pattern.

**Your instructions:**
1. **IDENTIFY:** Locate all the existing cushions in the 'Base Image' that are intended for modification (e.g., the plain white cushions).
2. **REPLACE:** Apply the complete pattern from the 'Design Image' onto the entire surface of ONLY the cushions you identified.
3. **DO NOT ADD:** Do not add any new cushions or any other objects to the image. The number of cushions in the final image must remain exactly the same as in the original 'Base Image'.
4. **PRESERVE:** Maintain the original lighting, shadows, folds, and contours of the cushions perfectly to ensure a realistic result. Do not change the background or any other element in the photo.

Your output should be ONLY the modified image.`;

const App: React.FC = () => {
  const [baseImage, setBaseImage] = useState<File | null>(null);
  const [designImage, setDesignImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [baseImagePreview, setBaseImagePreview] = useState<string | null>(null);
  const [designImagePreview, setDesignImagePreview] = useState<string | null>(null);

  const handleBaseImageChange = (file: File | null) => {
    setBaseImage(file);
    if (baseImagePreview) {
      URL.revokeObjectURL(baseImagePreview);
    }
    if (file) {
      setBaseImagePreview(URL.createObjectURL(file));
    } else {
      setBaseImagePreview(null);
    }
  };

  const handleDesignImageChange = (file: File | null) => {
    setDesignImage(file);
    if (designImagePreview) {
      URL.revokeObjectURL(designImagePreview);
    }
    if (file) {
      setDesignImagePreview(URL.createObjectURL(file));
    } else {
      setDesignImagePreview(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = useCallback(async () => {
    if (!baseImage || !designImage || !prompt) {
      setError('Please provide a base image, a design image, and a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const baseImageBase64 = await fileToBase64(baseImage);
      const designImageBase64 = await fileToBase64(designImage);

      const generatedResult = await editImageWithDesign(
        { base64: baseImageBase64, mimeType: baseImage.type },
        { base64: designImageBase64, mimeType: designImage.type },
        prompt
      );
      
      setResult(generatedResult);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [baseImage, designImage, prompt]);

  const handleReset = useCallback(() => {
    if (baseImagePreview) URL.revokeObjectURL(baseImagePreview);
    if (designImagePreview) URL.revokeObjectURL(designImagePreview);

    setBaseImage(null);
    setDesignImage(null);
    setBaseImagePreview(null);
    setDesignImagePreview(null);
    setPrompt(DEFAULT_PROMPT);
    setResult(null);
    setIsLoading(false);
    setError(null);

    const baseInput = document.getElementById('base-image') as HTMLInputElement;
    if (baseInput) baseInput.value = '';
    const designInput = document.getElementById('design-image') as HTMLInputElement;
    if (designInput) designInput.value = '';
  }, [baseImagePreview, designImagePreview]);


  const isGenerateDisabled = !baseImage || !designImage || !prompt || isLoading;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <main className="container mx-auto px-4 py-8">
        <Header />

        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 mt-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <ImageUploader 
              id="base-image"
              title="1. Base Image"
              description="Upload the main image (e.g., white cushions)."
              onImageChange={handleBaseImageChange}
              previewUrl={baseImagePreview}
            />
            <ImageUploader 
              id="design-image"
              title="2. Design / Pattern"
              description="Upload the fabric or pattern image."
              onImageChange={handleDesignImageChange}
              previewUrl={designImagePreview}
            />
          </div>

          <div className="mt-8">
            <label htmlFor="prompt" className="block text-sm font-medium text-indigo-300 mb-2">3. Describe the Edit</label>
            <textarea
              id="prompt"
              rows={12}
              className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              placeholder="e.g., Apply the fabric pattern to the cushions..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="mt-8 text-center">
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerateDisabled}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
              >
                {isLoading ? 'Generating...' : '✨ Generate Design'}
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-gray-600 text-white font-bold rounded-full hover:bg-gray-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50"
                aria-label="Start over"
              >
                Start Over
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">If an error occurs, click "Start Over" to reset the application.</p>
          </div>
        </div>

        {isLoading && <Spinner />}
        
        {error && (
          <div className="mt-8 max-w-4xl mx-auto bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {result && baseImagePreview && (
          <ResultDisplay
            originalImageUrl={baseImagePreview}
            generatedImageUrl={result.image}
            generatedText={result.text}
          />
        )}
      </main>
    </div>
  );
};

export default App;
