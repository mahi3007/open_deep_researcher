import React from 'react';
import { motion } from 'framer-motion';

const ResearchCard = ({ title, summary, metrics, onClick }) => {
    // Calculate quality score color
    const getScoreColor = (score) => {
        if (!score) return 'text-slate-400';
        if (score >= 0.8) return 'text-emerald-400';
        if (score >= 0.6) return 'text-amber-400';
        return 'text-rose-400';
    };

    // Calculate average score if metrics exist
    const avgScore = metrics?.evidence_scores
        ? Object.values(metrics.evidence_scores).reduce((a, b) => a + b, 0) / Object.values(metrics.evidence_scores).length
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={onClick}
            className="glass rounded-xl p-5 border border-slate-700 cursor-pointer hover:border-teal-500/50 transition-all duration-200 shadow-lg hover:shadow-xl group"
        >
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-teal-400 group-hover:to-purple-500 transition-colors duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-teal-400 transition-colors">{title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">{summary}</p>

                    {/* Metrics Display */}
                    {metrics && (
                        <div className="flex flex-wrap gap-3 mb-3 text-xs">
                            {metrics.iteration_count && (
                                <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
                                    <span className="text-slate-400">Iterations:</span>
                                    <span className="text-white font-medium">{metrics.iteration_count}</span>
                                </div>
                            )}
                            {avgScore !== null && (
                                <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
                                    <span className="text-slate-400">Quality:</span>
                                    <span className={`font-medium ${getScoreColor(avgScore)}`}>
                                        {(avgScore * 100).toFixed(0)}%
                                    </span>
                                </div>
                            )}
                            {metrics.sub_questions && (
                                <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded border border-slate-700">
                                    <span className="text-slate-400">Sources:</span>
                                    <span className="text-white font-medium">{metrics.sub_questions.length * 3}+</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-teal-400 text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                        <span>View full report</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ResearchCard;
