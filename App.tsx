/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Languages, 
  ArrowRightLeft, 
  Copy, 
  Volume2, 
  Check, 
  Loader2, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateText, LANGUAGES } from './services/translationService';

export default function App() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setTranslatedText('');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await translateText(sourceText, sourceLang, targetLang);
      setTranslatedText(result);
    } catch (err) {
      setError('Failed to translate. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced translation could be added here, but manual trigger is often safer for API costs/limits
  // Let's stick to a button for now or a small delay.

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
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
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a voice for the language
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(langCode === 'auto' ? 'en' : langCode));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <Languages className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold font-display text-slate-900 tracking-tight">
            Linguist<span className="text-indigo-600">AI</span>
          </h1>
        </div>
        <p className="text-slate-500 max-w-md mx-auto">
          Experience seamless, intelligent translation powered by advanced AI.
        </p>
      </motion.div>

      <main className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          
          {/* Source Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]"
          >
            <div className="p-4 border-bottom border-slate-100 flex items-center justify-between bg-slate-50/50">
              <select 
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
              <button 
                onClick={() => setSourceText('')}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                title="Clear text"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="flex-1 p-6 resize-none focus:outline-none text-lg text-slate-800 placeholder:text-slate-300"
            />
            <div className="p-4 flex justify-between items-center bg-white">
              <div className="flex gap-2">
                <button 
                  onClick={() => speak(sourceText, sourceLang)}
                  disabled={!sourceText}
                  className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30"
                >
                  <Volume2 size={20} />
                </button>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {sourceText.length} characters
              </span>
            </div>
          </motion.div>

          {/* Swap Button (Desktop) */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <button 
              onClick={swapLanguages}
              disabled={sourceLang === 'auto'}
              className="p-3 bg-white border border-slate-200 rounded-full shadow-md hover:shadow-lg hover:scale-110 transition-all text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRightLeft size={20} />
            </button>
          </div>

          {/* Target Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]"
          >
            <div className="p-4 border-bottom border-slate-100 flex items-center justify-between bg-slate-50/50">
              <select 
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
              >
                {LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
              <div className="flex gap-1">
                <button 
                  onClick={copyToClipboard}
                  disabled={!translatedText}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                  title="Copy translation"
                >
                  {isCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto relative">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                  <p className="text-sm text-slate-500 font-medium">Translating...</p>
                </div>
              ) : null}
              
              {error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              ) : (
                <p className={`text-lg leading-relaxed ${!translatedText ? 'text-slate-300 italic' : 'text-slate-800'}`}>
                  {translatedText || "Translation will appear here..."}
                </p>
              )}
            </div>
            <div className="p-4 flex justify-between items-center bg-white">
              <div className="flex gap-2">
                <button 
                  onClick={() => speak(translatedText, targetLang)}
                  disabled={!translatedText}
                  className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30"
                >
                  <Volume2 size={20} />
                </button>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                <Sparkles size={10} />
                AI Powered
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={handleTranslate}
            disabled={isLoading || !sourceText.trim()}
            className="group relative px-8 py-4 bg-indigo-600 text-white rounded-2xl font-semibold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Languages className="w-5 h-5" />}
            <span>Translate Now</span>
          </button>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-12 text-slate-400 text-sm">
        <p>&copy; 2026 Linguist AI. Powered by Gemini.</p>
      </footer>
    </div>
  );
}
