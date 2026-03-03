import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';

const ResearchSidePanel = ({ isOpen, onClose, report }) => {
    const [copied, setCopied] = useState(false);
    const [exported, setExported] = useState(false);

    if (!isOpen || !report) return null;

    const handleCopyReport = () => {
        if (!report.content) return;
        navigator.clipboard.writeText(report.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportPDF = () => {
        if (!report.content) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);

        // Add title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Deep Research AI - Report', margin, margin);

        // Add report title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(report.title || 'Research Report', maxWidth);
        doc.text(titleLines, margin, margin + 10);

        // Add timestamp
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const timestamp = new Date().toLocaleString();
        doc.text(`Generated on: ${timestamp}`, margin, margin + 20);

        // Add divider
        doc.setLineWidth(0.5);
        doc.line(margin, margin + 25, pageWidth - margin, margin + 25);

        // Add content
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        // Remove markdown artifacts for PDF text (simple approach)
        const cleanContent = report.content
            .replace(/#{1,6}\s?/g, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

        const lines = doc.splitTextToSize(cleanContent, maxWidth);
        let yPosition = margin + 35;

        lines.forEach((line) => {
            if (yPosition > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += 7;
        });

        // Save the PDF
        const safeTitle = (report.title || 'research-report').toLowerCase().replace(/[^a-z0-9]/g, '-');
        const filename = `${safeTitle}-${new Date().getTime()}.pdf`;
        doc.save(filename);

        setExported(true);
        setTimeout(() => setExported(false), 2000);
    };

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '60%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="h-full bg-slate-950 shadow-2xl flex flex-col border-l border-slate-800 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-start justify-between p-6 pt-12 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20 flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0 overflow-visible">
                        <h2 className="text-lg font-bold text-white mb-1">Research Report</h2>
                        <p className="text-sm text-slate-400 break-words overflow-wrap-anywhere">{report.title}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors group flex-shrink-0 ml-2"
                >
                    <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-gradient-to-b from-slate-950 to-slate-900">
                <div className="max-w-4xl mx-auto">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            h1: ({ node, ...props }) => (
                                <h1 className="text-4xl font-bold mb-6 mt-8 bg-gradient-to-r from-teal-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" {...props} />
                            ),
                            h2: ({ node, ...props }) => (
                                <h2 className="text-3xl font-bold mb-4 mt-8 bg-gradient-to-r from-teal-300 to-purple-400 bg-clip-text text-transparent flex items-center gap-3" {...props} />
                            ),
                            h3: ({ node, ...props }) => (
                                <h3 className="text-2xl font-semibold mb-3 mt-6 text-teal-300" {...props} />
                            ),
                            h4: ({ node, ...props }) => (
                                <h4 className="text-xl font-semibold mb-2 mt-4 text-purple-300" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                                <p className="text-slate-300 leading-relaxed mb-4 text-base" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                                <ul className="list-none space-y-2 mb-4 ml-4" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                                <ol className="list-decimal list-inside space-y-2 mb-4 ml-4 text-slate-300" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                                <li className="text-slate-300 flex items-start gap-2">
                                    <span className="text-teal-400 mt-1.5">•</span>
                                    <span className="flex-1" {...props} />
                                </li>
                            ),
                            strong: ({ node, ...props }) => (
                                <strong className="font-bold text-white" {...props} />
                            ),
                            em: ({ node, ...props }) => (
                                <em className="italic text-purple-300" {...props} />
                            ),
                            code: ({ node, inline, ...props }) =>
                                inline ? (
                                    <code className="bg-slate-800 text-teal-300 px-2 py-0.5 rounded font-mono text-sm" {...props} />
                                ) : (
                                    <code className="block bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-sm overflow-x-auto border border-slate-700 mb-4" {...props} />
                                ),
                            pre: ({ node, ...props }) => (
                                <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto mb-4 border border-slate-700" {...props} />
                            ),
                            blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-4 border-teal-500 bg-slate-800/50 pl-4 py-2 my-4 italic text-slate-300" {...props} />
                            ),
                            a: ({ node, ...props }) => (
                                <a className="text-teal-400 hover:text-teal-300 underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
                            ),
                            table: ({ node, ...props }) => (
                                <div className="overflow-x-auto mb-4">
                                    <table className="min-w-full border border-slate-700 rounded-lg overflow-hidden" {...props} />
                                </div>
                            ),
                            thead: ({ node, ...props }) => (
                                <thead className="bg-gradient-to-r from-teal-900/50 to-purple-900/50" {...props} />
                            ),
                            th: ({ node, ...props }) => (
                                <th className="px-4 py-3 text-left font-semibold text-teal-300 border-b border-slate-700" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                                <td className="px-4 py-3 text-slate-300 border-b border-slate-800" {...props} />
                            ),
                            hr: ({ node, ...props }) => (
                                <hr className="my-8 border-t border-slate-700" {...props} />
                            ),
                        }}
                    >
                        {report.content}
                    </ReactMarkdown>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3 flex-shrink-0">
                <button 
                    onClick={handleExportPDF}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-all duration-200 border border-slate-700 flex items-center justify-center gap-2"
                >
                    {exported ? (
                        <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                    )}
                    {exported ? 'Exported!' : 'Export PDF'}
                </button>
                <button 
                    onClick={handleCopyReport}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                    {copied ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                    {copied ? 'Copied!' : 'Copy Report'}
                </button>
            </div>
        </motion.div>
    );
};

export default ResearchSidePanel;
