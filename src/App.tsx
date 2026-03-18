/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Languages, 
  ArrowRightLeft, 
  Copy, 
  Volume2, 
  Check, 
  Loader2, 
  Trash2,
  History,
  Star,
  Settings,
  Search,
  ChevronDown,
  Keyboard,
  Maximize2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateText, LANGUAGES } from './services/translationService';

interface HistoryItem {
  id: string;
  source: string;
  target: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

export default function App() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('linguist_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('linguist_history', JSON.stringify(history.slice(0, 50)));
  }, [history]);

  const handleTranslate = useCallback(async (text: string, sLang: string, tLang: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await translateText(text, sLang, tLang);
      setTranslatedText(result);
      
      // Add to history if it's a new meaningful translation
      if (text.length > 3) {
        const newItem: HistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          source: text,
          target: result,
          sourceLang: sLang,
          targetLang: tLang,
          timestamp: Date.now()
        };
        setHistory(prev => [newItem, ...prev.filter(h => h.source !== text)].slice(0, 50));
      }
    } catch (err) {
      setError('Translation service unavailable. Please check your connection.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-translate with debounce
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    if (sourceText.trim()) {
      debounceTimer.current = setTimeout(() => {
        handleTranslate(sourceText, sourceLang, targetLang);
      }, 1000);
    } else {
      setTranslatedText('');
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [sourceText, sourceLang, targetLang, handleTranslate]);

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    const tempS = sourceLang;
    const tempT = targetLang;
    setSourceLang(tempT);
    setTargetLang(tempS);
    setSourceText(translatedText);
  };

  const copyToClipboard = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const speak = (text: string, langCode: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(langCode === 'auto' ? 'en' : langCode));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const clearAll = () => {
    setSourceText('');
    setTranslatedText('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Languages className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">Linguist AI</span>
          <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded tracking-wider">Pro</span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
            title="History"
          >
            <History size={20} />
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <Star size={20} />
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <Settings size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-white shadow-sm" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col items-center">
          <div className="w-full max-w-6xl space-y-6">
            
            {/* Language Selection Bar */}
            <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-1 flex-1">
                <div className="relative group">
                  <select 
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="appearance-none bg-transparent pl-4 pr-10 py-2.5 font-medium text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer focus:outline-none transition-all"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
                </div>

                <div className="hidden sm:flex gap-1">
                  {['en', 'es', 'fr'].map(code => (
                    <button 
                      key={code}
                      onClick={() => setSourceLang(code)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${sourceLang === code ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {LANGUAGES.find(l => l.code === code)?.name}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={swapLanguages}
                disabled={sourceLang === 'auto'}
                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-20"
              >
                <ArrowRightLeft size={18} />
              </button>

              <div className="flex items-center gap-1 flex-1 justify-end">
                <div className="hidden sm:flex gap-1 mr-2">
                  {['es', 'de', 'ja'].map(code => (
                    <button 
                      key={code}
                      onClick={() => setTargetLang(code)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${targetLang === code ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {LANGUAGES.find(l => l.code === code)?.name}
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <select 
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="appearance-none bg-transparent pl-4 pr-10 py-2.5 font-medium text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer focus:outline-none transition-all"
                  >
                    {LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Translation Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-200 rounded-3xl overflow-hidden shadow-xl border border-slate-200">
              {/* Source Input */}
              <div className="bg-white p-8 flex flex-col min-h-[400px]">
                <div className="flex-1 flex flex-col">
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Type to translate..."
                    className="w-full flex-1 text-2xl font-light text-slate-800 placeholder:text-slate-200 resize-none focus:outline-none leading-relaxed"
                  />
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => speak(sourceText, sourceLang)}
                      className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Listen"
                    >
                      <Volume2 size={20} />
                    </button>
                    <button 
                      onClick={() => {}} 
                      className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Voice Input"
                    >
                      <Keyboard size={20} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      {sourceText.length} / 5000
                    </span>
                    <button 
                      onClick={clearAll}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Target Output */}
              <div className="bg-slate-50/50 p-8 flex flex-col min-h-[400px] relative">
                <AnimatePresence>
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-50/40 backdrop-blur-[2px] z-10 flex items-center justify-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Processing</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1">
                  {error ? (
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">!</div>
                      {error}
                    </div>
                  ) : (
                    <div className={`text-2xl font-light leading-relaxed ${!translatedText ? 'text-slate-300' : 'text-slate-800'}`}>
                      {translatedText || "Translation will appear here..."}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => speak(translatedText, targetLang)}
                      className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Listen"
                    >
                      <Volume2 size={20} />
                    </button>
                    <button 
                      onClick={copyToClipboard}
                      className={`p-3 rounded-xl transition-all ${isCopied ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                      title="Copy"
                    >
                      {isCopied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Share2 size={18} />
                    </button>
                    <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Maximize2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions / Info */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400 text-xs font-medium uppercase tracking-widest py-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                System Online
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Gemini 3.1 Flash
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Secure Connection
              </div>
            </div>
          </div>
        </main>

        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.aside 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-40"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <History size={18} className="text-blue-600" />
                  History
                </h2>
                <button 
                  onClick={() => setHistory([])}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider"
                >
                  Clear All
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <History size={24} className="text-slate-200" />
                    </div>
                    <p className="text-sm text-slate-400">Your translation history will appear here.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSourceText(item.source);
                        setSourceLang(item.sourceLang);
                        setTargetLang(item.targetLang);
                      }}
                      className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                          {item.sourceLang} <ArrowRightLeft size={8} /> {item.targetLang}
                        </div>
                        <span className="text-[9px] text-slate-300">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium line-clamp-1 mb-1">{item.source}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{item.target}</p>
                    </button>
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcuts Overlay (Optional/Visual) */}
      <div className="fixed bottom-6 left-6 hidden xl:flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm text-slate-500">⌘</kbd>
          <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm text-slate-500">Enter</kbd>
          <span>Translate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm text-slate-500">S</kbd>
          <span>Swap</span>
        </div>
      </div>
    </div>
  );
}
