// Demiurge Side Panel - Page Analysis + DRC-369 NFT Minting
import React, { useState, useCallback } from 'react';

interface AnalysisResult {
  title: string;
  summary: string;
  tags: string[];
  url: string;
}

export function AnalyzeScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [mintResult, setMintResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzePage = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setMintResult(null);

    try {
      // Get the current tab
      const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve);
      });
      const tab = tabs[0];
      if (!tab?.id) {
        setError('No active tab found.');
        return;
      }

      // Extract page content via content script
      const pageContext = await new Promise<any>((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id!, { type: 'GET_PAGE_CONTEXT' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response?.data || {});
          }
        });
      });

      if (!pageContext.content && !pageContext.title) {
        setError('Could not extract page content. Try refreshing the page.');
        return;
      }

      // Send to Sophia for analysis
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_PAGE',
        payload: {
          url: pageContext.url || tab.url || '',
          title: pageContext.title || tab.title || '',
          content: pageContext.content || '',
        },
      });

      if (!response.success) {
        setError(response.error || 'Analysis failed.');
        return;
      }

      // Try to parse structured response
      const text = response.data?.text || '';
      let parsed: AnalysisResult;

      try {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const json = JSON.parse(jsonMatch[0]);
          parsed = {
            title: json.title || pageContext.title || '',
            summary: json.summary || text,
            tags: json.tags || [],
            url: pageContext.url || tab.url || '',
          };
        } else {
          parsed = {
            title: pageContext.title || tab.title || 'Page Summary',
            summary: text,
            tags: [],
            url: pageContext.url || tab.url || '',
          };
        }
      } catch {
        parsed = {
          title: pageContext.title || tab.title || 'Page Summary',
          summary: text,
          tags: [],
          url: pageContext.url || tab.url || '',
        };
      }

      setAnalysis(parsed);
    } catch (err) {
      setError((err as Error).message || 'Failed to analyze page.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const mintAsNFT = useCallback(async () => {
    if (!analysis) return;

    setIsMinting(true);
    setError(null);
    setMintResult(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'MINT_SUMMARY_NFT',
        payload: {
          url: analysis.url,
          title: analysis.title,
          summary: analysis.summary,
          tags: analysis.tags,
        },
      });

      if (response.success) {
        setMintResult(response.data?.text || 'DRC-369 NFT minted successfully!');
      } else {
        setError(response.error || 'Minting failed.');
      }
    } catch (err) {
      setError((err as Error).message || 'Minting failed.');
    } finally {
      setIsMinting(false);
    }
  }, [analysis]);

  const saveAsNote = useCallback(async () => {
    if (!analysis) return;

    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_NOTE',
        payload: {
          title: analysis.title,
          content: analysis.summary,
          url: analysis.url,
          tags: analysis.tags,
        },
      });
      setMintResult('Saved to notes!');
    } catch (err) {
      setError('Failed to save note.');
    }
  }, [analysis]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Analyze Button */}
        {!analysis && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-demiurge-400/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Page Analysis</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-[250px]">
              Let Sophia analyze the current page and generate a structured summary.
              You can then mint it as a DRC-369 NFT.
            </p>
            <button
              onClick={analyzePage}
              className="px-6 py-3 bg-gradient-to-r from-demiurge-500 to-purple-500 hover:from-demiurge-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all transform hover:scale-105"
            >
              Analyze This Page
            </button>
          </div>
        )}

        {/* Loading */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 border-3 border-demiurge-500 border-t-transparent rounded-full spinner mb-4" />
            <p className="text-gray-400 text-sm">Sophia is analyzing the page...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => { setError(null); setAnalysis(null); }}
              className="text-xs text-red-400/70 hover:text-red-400 mt-2"
            >
              Try again
            </button>
          </div>
        )}

        {/* Analysis Result */}
        {analysis && (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{analysis.title}</h3>
              <a
                href={analysis.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-demiurge-400 hover:text-demiurge-300 truncate block"
              >
                {analysis.url}
              </a>
            </div>

            {/* Summary */}
            <div className="card">
              <h4 className="text-xs font-medium text-gray-400 mb-2">Summary</h4>
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Tags */}
            {analysis.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-400 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-demiurge-500/20 text-demiurge-400 rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mint Result */}
            {mintResult && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-400 text-sm">{mintResult}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={mintAsNFT}
                disabled={isMinting || !!mintResult}
                className="w-full py-3 bg-gradient-to-r from-demiurge-500 to-purple-500 hover:from-demiurge-600 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isMinting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
                    Minting...
                  </>
                ) : (
                  <>
                    <span>🎨</span>
                    Mint as DRC-369 NFT
                  </>
                )}
              </button>

              <button
                onClick={saveAsNote}
                className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>📝</span>
                Save as Note
              </button>

              <button
                onClick={() => { setAnalysis(null); setMintResult(null); setError(null); }}
                className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Analyze Another Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
