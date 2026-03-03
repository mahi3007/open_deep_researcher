import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const MetricsDashboard = ({ conversations, onClose }) => {
    // Process data to extract metrics
    const stats = useMemo(() => {
        let totalResearch = 0;
        let totalIterations = 0;
        let totalScore = 0;
        let scoreCount = 0;
        const trendData = [];

        conversations.forEach(conv => {
            conv.messages.forEach(msg => {
                if (msg.role === 'research_result') {
                    let metrics = msg.metrics;

                    // Try to parse if content is string and metrics missing
                    if (!metrics && typeof msg.content === 'string') {
                        try {
                            const parsed = JSON.parse(msg.content);
                            metrics = parsed.metrics;
                        } catch (e) { }
                    }

                    if (metrics) {
                        totalResearch++;
                        if (metrics.iteration_count) totalIterations += metrics.iteration_count;

                        if (metrics.evidence_scores) {
                            const scores = Object.values(metrics.evidence_scores);
                            if (scores.length > 0) {
                                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                                totalScore += avg;
                                scoreCount++;

                                trendData.push({
                                    date: new Date(msg.timestamp || conv.created_at).toLocaleDateString(),
                                    score: avg,
                                    title: conv.title
                                });
                            }
                        }
                    }
                }
            });
        });

        return {
            totalResearch,
            avgIterations: totalResearch ? (totalIterations / totalResearch).toFixed(1) : 0,
            avgQuality: scoreCount ? ((totalScore / scoreCount) * 100).toFixed(1) : 0,
            trendData: trendData.sort((a, b) => new Date(a.date) - new Date(b.date))
        };
    }, [conversations]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Research Analytics</h2>
                    <p className="text-slate-400 mb-8">Performance metrics across all research sessions</p>

                    {/* Key Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                            <div className="text-slate-400 text-sm mb-1">Total Reports</div>
                            <div className="text-3xl font-bold text-white">{stats.totalResearch}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                            <div className="text-slate-400 text-sm mb-1">Avg. Iterations</div>
                            <div className="text-3xl font-bold text-emerald-400">{stats.avgIterations}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                            <div className="text-slate-400 text-sm mb-1">Avg. Quality Score</div>
                            <div className={`text-3xl font-bold ${stats.avgQuality >= 80 ? 'text-emerald-400' : stats.avgQuality >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {stats.avgQuality}%
                            </div>
                        </div>
                    </div>

                    {/* Quality Trend */}
                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 mb-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Quality Score History</h3>
                        {stats.trendData.length > 0 ? (
                            <div className="space-y-3">
                                {stats.trendData.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-24 text-xs text-slate-500">{item.date}</div>
                                        <div className="flex-1">
                                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${item.score >= 0.8 ? 'bg-emerald-500' : item.score >= 0.6 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${item.score * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-12 text-right text-sm font-medium text-slate-300">{(item.score * 100).toFixed(0)}%</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-500">
                                No research data available yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MetricsDashboard;
