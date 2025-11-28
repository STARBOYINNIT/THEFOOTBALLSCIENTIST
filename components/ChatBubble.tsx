import React from 'react';
import { Message, Outcome } from '../types';
import { Bot, User, Globe, ExternalLink, Newspaper, Clock, Tag } from 'lucide-react';
import { PredictionCard } from './PredictionCard';

interface ChatBubbleProps {
  message: Message;
  onOutcomeUpdate: (matchId: string, outcome: Outcome) => void;
}

const CategoryBadge: React.FC<{ category?: string }> = ({ category }) => {
  if (!category) return null;
  
  const getColors = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('transfer')) return 'bg-yellow-900/40 text-yellow-500 border-yellow-800';
    if (c.includes('injury')) return 'bg-rose-900/40 text-rose-500 border-rose-800';
    if (c.includes('match')) return 'bg-emerald-900/40 text-emerald-500 border-emerald-800';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${getColors(category)}`}>
      {category}
    </span>
  );
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onOutcomeUpdate }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-8 animate-in fade-in slide-in-from-bottom-2`}>
      {/* Avatar */}
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border shadow-lg ${isUser ? 'bg-slate-800 border-slate-700' : 'bg-emerald-950/50 border-emerald-500/50'}`}>
        {isUser ? <User size={20} className="text-slate-400" /> : <Bot size={24} className="text-emerald-500" />}
      </div>

      {/* Content Container */}
      <div className={`flex flex-col gap-3 max-w-[90%] md:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Text Bubble */}
        <div className={`px-5 py-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
          isUser 
            ? 'bg-slate-800 text-slate-200 rounded-tr-none border border-slate-700' 
            : 'bg-slate-900/80 text-slate-300 rounded-tl-none border border-slate-800'
        }`}>
          {message.content}
        </div>

        {/* Predictions Grid (Only for AI) */}
        {!isUser && message.predictions && message.predictions.length > 0 && (
          <div className="w-full grid grid-cols-1 gap-4 mt-2">
            {message.predictions.map((match) => (
              <PredictionCard 
                key={match.id} 
                match={match} 
                onOutcomeUpdate={match.id ? (outcome) => onOutcomeUpdate(match.id!, outcome) : undefined}
              />
            ))}
          </div>
        )}

        {/* News Feed Grid (Only for AI) */}
        {!isUser && message.news && message.news.length > 0 && (
          <div className="w-full mt-2 space-y-3">
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
               <Newspaper size={14} className="text-emerald-500" />
               Latest Updates
             </div>
             <div className="grid grid-cols-1 gap-3">
              {message.news.map((item) => (
                 <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                           {item.sourceName}
                         </span>
                         <span className="text-slate-700 text-[10px]">•</span>
                         <CategoryBadge category={item.category} />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock size={10} />
                        {item.publishedTime || 'Recently'}
                      </div>
                    </div>
                    
                    <h4 className="text-white font-bold text-base leading-snug mb-2 font-['Oswald'] tracking-wide group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h4>
                    
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-3 border-l-2 border-slate-800 pl-3">
                      {item.summary}
                    </p>
                    
                    {item.url && (
                      <div className="flex justify-end">
                        <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-900/50 hover:bg-emerald-900/50 transition-all">
                          Read Full Article <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                 </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources (Only for AI) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1 px-1">
            {message.sources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
              >
                <Globe size={10} />
                {source.title}
              </a>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-600 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
