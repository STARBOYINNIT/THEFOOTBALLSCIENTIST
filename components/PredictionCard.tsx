
import React from 'react';
import { MatchAnalysis, ConfidenceLevel, Outcome } from '../types';
import { Trophy, TrendingUp, AlertTriangle, ShieldCheck, Activity, CheckCircle, XCircle, Clock, Banknote, Star, Map, AlertOctagon, GitBranch } from 'lucide-react';

interface PredictionCardProps {
  match: MatchAnalysis;
  onOutcomeUpdate?: (outcome: Outcome) => void;
}

const ConfidenceBadge: React.FC<{ level: ConfidenceLevel }> = ({ level }) => {
  const colors = {
    [ConfidenceLevel.LOW]: 'bg-rose-900/50 text-rose-200 border-rose-700',
    [ConfidenceLevel.MEDIUM]: 'bg-amber-900/50 text-amber-200 border-amber-700',
    [ConfidenceLevel.HIGH]: 'bg-emerald-900/50 text-emerald-200 border-emerald-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[level] || colors[ConfidenceLevel.LOW]} uppercase tracking-wider flex items-center gap-1`}>
      <Activity size={14} />
      {level || ConfidenceLevel.LOW} Confidence
    </span>
  );
};

export const PredictionCard: React.FC<PredictionCardProps> = ({ match, onOutcomeUpdate }) => {
  const getCardStyle = () => {
    switch (match.outcome) {
      case 'correct':
        return 'border-emerald-500/50 shadow-emerald-900/20';
      case 'incorrect':
        return 'border-rose-500/50 shadow-rose-900/20';
      default:
        return 'border-slate-800 hover:shadow-slate-800/50';
    }
  };

  const prediction = match.prediction || ({} as any);
  const result1X2 = prediction.result1X2;
  const correctScore = prediction.correctScore;
  const overUnder = prediction.overUnder;
  const btts = prediction.btts;
  const safeBet = prediction.safeBet;
  const valueRating = prediction.valueRating;
  
  const isBttsYes = btts?.toLowerCase?.().includes('yes') ?? false;
  const isHighValue = valueRating?.toLowerCase()?.includes('high');
  const statusLower = match.status?.toLowerCase() || 'scheduled';
  const isLive = statusLower === 'live' || statusLower === 'in_play';
  const isFinished = statusLower === 'finished' || statusLower === 'ft';
  const hasPredictionData = result1X2 && result1X2 !== 'N/A';

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden shadow-lg transition-all duration-300 relative group ${getCardStyle()}`}>
      
      {match.outcome && match.outcome !== 'pending' && (
        <div className={`absolute top-0 right-0 p-4 z-10 opacity-20 group-hover:opacity-100 transition-opacity pointer-events-none`}>
          {match.outcome === 'correct' ? (
            <CheckCircle size={100} className="text-emerald-500" />
          ) : (
            <XCircle size={100} className="text-rose-500" />
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-start relative z-10">
        <div className="flex-1 mr-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">
            <Trophy size={14} className="text-emerald-500" />
            {match.league || 'Unknown League'}
            {isLive && (
              <span className="flex items-center gap-1 text-rose-500 font-bold ml-2 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                LIVE
              </span>
            )}
            {isFinished && <span className="text-slate-500 font-bold ml-2">FT</span>}
          </div>
          
          <div className="flex items-end gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-white font-['Oswald'] tracking-wide leading-tight">
              {match.matchTitle || 'Match Prediction'}
            </h3>
            {(isLive || isFinished) && match.score && (
               <div className="bg-slate-800 px-2 py-0.5 rounded text-white font-mono font-bold text-lg leading-none border border-slate-700">
                 {match.score}
               </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Clock size={12} className="text-slate-500" />
            <p className="text-slate-500 text-sm">
              {isLive ? (
                <span className="text-emerald-400 font-bold">{match.minute || 'In Play'}</span>
              ) : (
                match.kickOff || 'Time TBD'
              )}
            </p>
          </div>
        </div>
        <ConfidenceBadge level={match.confidence} />
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Left Column: Analysis & Insights */}
        <div className="space-y-4">
          
          {/* Odds */}
          {match.odds && (match.odds.home || match.odds.draw || match.odds.away) && (
            <div className="bg-slate-950 rounded-lg p-2 border border-slate-800 flex justify-between items-center text-sm">
               <div className="flex flex-col items-center px-2 border-r border-slate-800 w-1/3">
                 <span className="text-[10px] text-slate-500 uppercase">1</span>
                 <span className="font-mono text-emerald-400 font-bold">{match.odds.home || '-'}</span>
               </div>
               <div className="flex flex-col items-center px-2 border-r border-slate-800 w-1/3">
                 <span className="text-[10px] text-slate-500 uppercase">X</span>
                 <span className="font-mono text-slate-300 font-bold">{match.odds.draw || '-'}</span>
               </div>
               <div className="flex flex-col items-center px-2 w-1/3">
                 <span className="text-[10px] text-slate-500 uppercase">2</span>
                 <span className="font-mono text-rose-400 font-bold">{match.odds.away || '-'}</span>
               </div>
            </div>
          )}

          {/* Tactical & Stats */}
          <div>
            <h4 className="text-slate-300 font-semibold mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Map size={14} className="text-blue-400" />
              Tactical & Key Stats
            </h4>
            <ul className="space-y-1.5">
              {match.tacticalAnalysis && match.tacticalAnalysis.length > 0 ? (
                match.tacticalAnalysis.slice(0, 2).map((t, i) => (
                  <li key={i} className="text-xs text-slate-300 pl-3 border-l-2 border-blue-500/50">{t}</li>
                ))
              ) : null}
              {match.stats && match.stats.slice(0, 3).map((stat, idx) => (
                <li key={idx} className="text-xs text-slate-400 pl-3 border-l-2 border-slate-700">
                  {stat}
                </li>
              ))}
            </ul>
          </div>

          {/* Risk Flags */}
          {match.riskFlags && match.riskFlags.length > 0 && (
             <div className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-3">
               <h4 className="text-rose-400 font-bold text-xs uppercase flex items-center gap-1.5 mb-2">
                 <AlertOctagon size={14} /> Risk Assessment
               </h4>
               <ul className="space-y-1">
                 {match.riskFlags.map((risk, i) => (
                   <li key={i} className="text-xs text-rose-200/80 flex items-start gap-1.5">
                     <span className="mt-0.5 w-1 h-1 rounded-full bg-rose-500 shrink-0"></span>
                     {risk}
                   </li>
                 ))}
               </ul>
             </div>
          )}
          
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            <h4 className="text-slate-300 font-semibold mb-2 text-xs uppercase">Analyst Reasoning</h4>
            <p className="text-sm text-slate-400 leading-relaxed italic">
              "{match.reasoning || 'Analysis unavailable.'}"
            </p>
          </div>
        </div>

        {/* Right Column: Predictions & Scenarios */}
        {hasPredictionData ? (
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                <span className="text-slate-500 text-xs uppercase block mb-1">Result</span>
                <span className="text-emerald-400 font-bold text-lg leading-none">{result1X2}</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                <span className="text-slate-500 text-xs uppercase block mb-1">Score</span>
                <span className="text-white font-bold text-lg leading-none">{correctScore}</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                <span className="text-slate-500 text-xs uppercase block mb-1">Goals</span>
                <span className="text-slate-200 font-semibold">{overUnder}</span>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg text-center border border-slate-700">
                <span className="text-slate-500 text-xs uppercase block mb-1">BTTS</span>
                <span className={`font-semibold ${isBttsYes ? 'text-green-400' : 'text-red-400'}`}>
                  {btts}
                </span>
              </div>
            </div>

            {/* Scenarios */}
            {match.scenarios && match.scenarios.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1">
                  <GitBranch size={12} /> Match Scenarios
                </h5>
                {match.scenarios.slice(0, 2).map((scene, i) => (
                  <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-500">{scene.name}</span>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{scene.probability}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">{scene.description}</p>
                  </div>
                ))}
              </div>
            )}
            
            {safeBet && safeBet !== 'N/A' && (
              <div className="mt-auto bg-emerald-900/20 border border-emerald-900/50 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-500" />
                  <span className="text-emerald-200 text-sm font-semibold">Safer Option</span>
                </div>
                <span className="text-emerald-100 font-bold text-sm">{safeBet}</span>
              </div>
            )}

            {valueRating && (
              <div className={`p-1.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wide border ${isHighValue ? 'bg-yellow-900/20 text-yellow-500 border-yellow-700/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                {isHighValue ? <Star size={12} className="fill-yellow-500 text-yellow-500" /> : <Banknote size={12} />}
                {valueRating}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 italic text-sm border-l border-slate-800 pl-4">
            Waiting for full prediction data...
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-3 relative z-10">
         <div className="text-xs text-slate-600 flex items-center gap-2">
            <AlertTriangle size={12} />
            <span>Predictions are estimates. Use responsibly.</span>
         </div>
         {onOutcomeUpdate && (
           <div className="flex items-center gap-3">
             <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
               {match.outcome && match.outcome !== 'pending' ? 'Verified Result' : 'Verify Result'}
             </span>
             <div className="flex gap-2">
               <button 
                 onClick={() => onOutcomeUpdate('correct')}
                 title="Mark as Correct"
                 className={`p-1.5 rounded-full transition-all border ${match.outcome === 'correct' ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-emerald-400 hover:border-emerald-500/50'}`}
               >
                 <CheckCircle size={16} />
               </button>
               <button 
                 onClick={() => onOutcomeUpdate('incorrect')}
                 title="Mark as Incorrect"
                 className={`p-1.5 rounded-full transition-all border ${match.outcome === 'incorrect' ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-rose-400 hover:border-rose-500/50'}`}
               >
                 <XCircle size={16} />
               </button>
             </div>
           </div>
         )}
      </div>
    </div>
  );
};
