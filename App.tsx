
import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Send, Trash2, PieChart, History, ChevronDown, Sparkles, Trophy, XCircle, CheckCircle, Clock, ListFilter, Activity } from 'lucide-react';
import { sendChatMessage, resetChat } from './services/geminiService';
import { Message, Outcome, MatchAnalysis } from './types';
import { ChatBubble } from './components/ChatBubble';
import { PredictionCard } from './components/PredictionCard';

type ViewMode = 'chat' | 'history';
type HistoryFilter = 'all' | 'pending' | 'settled';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewMode>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [persistedHistory, setPersistedHistory] = useState<MatchAnalysis[]>([]);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  // Load persisted history (predictions only) for accuracy tracking
  useEffect(() => {
    const savedHistory = localStorage.getItem('footy_history_v2');
    if (savedHistory) {
      try {
        setPersistedHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('footy_history_v2', JSON.stringify(persistedHistory));
  }, [persistedHistory]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (view === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, view]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(userMsg.content);
      
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: response.content,
        predictions: response.predictions,
        news: response.news,
        sources: response.sources,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);

      // If there are predictions, add them to persisted history
      if (response.predictions && response.predictions.length > 0) {
        setPersistedHistory(prev => [...response.predictions!, ...prev]);
      }

    } catch (err: any) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: "Sorry, I encountered an error connecting to the football database. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm("Start a new chat session? Current conversation will be cleared.")) {
      resetChat();
      setMessages([]);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire prediction history? This cannot be undone.")) {
      setPersistedHistory([]);
    }
  };

  const updateOutcome = (matchId: string, outcome: Outcome) => {
    setPersistedHistory(prev => 
      prev.map(m => m.id === matchId ? { ...m, outcome } : m)
    );
    // Also update current chat messages if the match is visible there
    setMessages(prev => 
      prev.map(msg => ({
        ...msg,
        predictions: msg.predictions?.map(m => m.id === matchId ? { ...m, outcome } : m)
      }))
    );
  };

  // Compute Detailed Stats
  const stats = React.useMemo(() => {
    const total = persistedHistory.length;
    const correct = persistedHistory.filter(m => m.outcome === 'correct').length;
    const incorrect = persistedHistory.filter(m => m.outcome === 'incorrect').length;
    const pending = total - correct - incorrect;
    
    const totalResolved = correct + incorrect;
    const accuracy = totalResolved > 0 ? Math.round((correct / totalResolved) * 100) : 0;
    
    // Get last 5 settled outcomes for form guide
    const recentForm = persistedHistory
      .filter(m => m.outcome === 'correct' || m.outcome === 'incorrect')
      .slice(0, 5)
      .map(m => m.outcome);
    
    return { total, correct, incorrect, pending, accuracy, recentForm };
  }, [persistedHistory]);

  const displayedHistory = persistedHistory.filter(match => {
    if (historyFilter === 'pending') return match.outcome === 'pending' || !match.outcome;
    if (historyFilter === 'settled') return match.outcome === 'correct' || match.outcome === 'incorrect';
    return true;
  });

  const suggestionPills = [
    "Predict today's top matches",
    "Real Madrid vs Barcelona stats",
    "Safe accumulator for Saturday",
    "Latest Liverpool news"
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Header */}
      <header className="shrink-0 bg-slate-950/80 backdrop-blur border-b border-slate-800 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('chat')}>
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <BrainCircuit className="text-emerald-500" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight font-['Oswald']">
                FOOTY <span className="text-emerald-500">BRAINIAC</span>
              </h1>
              <p className="text-[10px] text-slate-400 tracking-wide uppercase">AI Data Analyst</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setView('history')}
               className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold ${view === 'history' ? 'bg-slate-800 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
             >
               <History size={18} />
               <span className="hidden sm:inline">History</span>
             </button>
             <button 
                onClick={handleResetChat}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 transition-colors"
                title="Reset Chat"
              >
                <Trash2 size={18} />
              </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative max-w-5xl mx-auto w-full flex flex-col">
        
        {view === 'chat' ? (
          <>
            {/* Chat Scroll Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-0 animate-in fade-in slide-in-from-bottom-8 duration-700 forwards">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                    <BrainCircuit size={80} className="text-emerald-500 relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white font-['Oswald'] mb-2">How can I help today?</h2>
                    <p className="text-slate-400 max-w-md mx-auto">
                      I'm your AI football analyst. Ask me about predictions, stats, lineups, or the latest news.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                    {suggestionPills.map((s) => (
                      <button 
                        key={s}
                        onClick={() => setInput(s)}
                        className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 rounded-xl text-sm text-slate-300 transition-all text-left flex items-center gap-2 group"
                      >
                        <Sparkles size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <ChatBubble 
                      key={msg.id} 
                      message={msg} 
                      onOutcomeUpdate={updateOutcome} 
                    />
                  ))}
                  
                  {loading && (
                    <div className="flex gap-4 mb-8">
                       <div className="shrink-0 w-10 h-10 bg-emerald-950/50 border border-emerald-500/50 rounded-full flex items-center justify-center">
                         <BrainCircuit size={20} className="text-emerald-500 animate-pulse" />
                       </div>
                       <div className="flex items-center gap-1 mt-3">
                         <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                         <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                         <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                       </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-slate-950/80 backdrop-blur border-t border-slate-900 z-10">
              <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-end gap-2">
                <div className="relative flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder="Ask about any match, team, or stats..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-4 pr-12 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none max-h-32 min-h-[50px]"
                    rows={1}
                    style={{ height: 'auto', minHeight: '52px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex-shrink-0"
                >
                  <Send size={20} />
                </button>
              </form>
              <div className="text-center mt-2">
                 <p className="text-[10px] text-slate-600">
                    AI can make mistakes. Check important info.
                 </p>
              </div>
            </div>
          </>
        ) : (
          /* History View */
          <div className="flex-1 overflow-y-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Stats Dashboard */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 {/* Win Rate Card */}
                 <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <PieChart size={60} />
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs uppercase tracking-widest font-bold block mb-1">Win Rate</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-bold font-['Oswald'] ${stats.accuracy >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {stats.accuracy}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${stats.accuracy >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                        style={{ width: `${stats.accuracy}%` }}
                      ></div>
                    </div>
                 </div>

                 {/* Predictions Count */}
                 <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <span className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-1">Total Predictions</span>
                    <div className="text-4xl font-bold text-white font-['Oswald']">{stats.total}</div>
                 </div>

                 {/* Results Split */}
                 <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-center gap-3">
                    <div className="flex justify-between items-center">
                       <span className="text-slate-500 text-xs uppercase font-bold">Correct</span>
                       <span className="text-emerald-400 font-bold font-mono">{stats.correct}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-slate-500 text-xs uppercase font-bold">Incorrect</span>
                       <span className="text-rose-400 font-bold font-mono">{stats.incorrect}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-slate-500 text-xs uppercase font-bold">Pending</span>
                       <span className="text-slate-300 font-bold font-mono">{stats.pending}</span>
                    </div>
                 </div>

                 {/* Recent Form */}
                 <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                       <Activity size={14} className="text-blue-400" />
                       <span className="text-slate-500 text-xs uppercase tracking-widest font-bold">Recent Form</span>
                    </div>
                    <div className="flex items-center gap-1.5 h-8">
                       {stats.recentForm.length > 0 ? (
                         stats.recentForm.map((outcome, i) => (
                           <div 
                             key={i} 
                             className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                               outcome === 'correct' 
                                 ? 'bg-emerald-500 text-emerald-950 border-emerald-400' 
                                 : 'bg-rose-500 text-rose-950 border-rose-400'
                             }`}
                           >
                             {outcome === 'correct' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                           </div>
                         ))
                       ) : (
                         <span className="text-slate-600 text-xs italic">No settled bets yet</span>
                       )}
                    </div>
                 </div>
              </div>

              {/* Filters & Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white font-['Oswald'] flex items-center gap-2">
                   <History className="text-emerald-500" size={24} />
                   Prediction History
                </h2>
                
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                   <button 
                     onClick={() => setHistoryFilter('all')}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-colors ${historyFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     All
                   </button>
                   <button 
                     onClick={() => setHistoryFilter('pending')}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-colors flex items-center gap-1 ${historyFilter === 'pending' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     <Clock size={12} /> Pending
                   </button>
                   <button 
                     onClick={() => setHistoryFilter('settled')}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-colors flex items-center gap-1 ${historyFilter === 'settled' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     <Trophy size={12} /> Settled
                   </button>
                </div>
              </div>

              {/* History List */}
              {displayedHistory.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                  <ListFilter size={48} className="mx-auto text-slate-700 mb-4" />
                  <p className="text-slate-500">
                    {historyFilter === 'all' 
                      ? "No predictions recorded yet." 
                      : `No ${historyFilter} predictions found.`}
                  </p>
                  {historyFilter === 'all' && (
                    <button onClick={() => setView('chat')} className="mt-4 text-emerald-500 hover:underline">
                      Go to Chat to get started
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {displayedHistory.map((match) => (
                    <PredictionCard 
                      key={match.id} 
                      match={match} 
                      onOutcomeUpdate={(outcome) => updateOutcome(match.id!, outcome)} 
                    />
                  ))}
                </div>
              )}

              {persistedHistory.length > 0 && (
                <div className="text-center pt-8 border-t border-slate-900">
                   <button 
                     onClick={handleClearHistory}
                     className="text-xs text-rose-500 hover:text-rose-400 flex items-center justify-center gap-2 mx-auto"
                   >
                     <Trash2 size={12} /> Clear Prediction History
                   </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
