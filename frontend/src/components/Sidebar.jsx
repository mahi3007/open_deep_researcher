import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Sidebar = ({
    conversations = [],
    currentConversationId,
    onNewChat,
    onSelectConversation,
    onDeleteConversation,
    onOpenDashboard,
    isOpen = false,
    onToggle,
    onMouseEnter,
    onMouseLeave
}) => {
    const [hoveredId, setHoveredId] = useState(null);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {/* Logo Trigger - Always Visible */}
            <div
                className="fixed top-3 left-4 z-50 flex items-center space-x-3 cursor-pointer group"
                onClick={onToggle}
                onMouseEnter={onMouseEnter}
            >
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/50 group-hover:shadow-teal-500/70 transition-shadow duration-200">
                    <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                    </svg>
                </div>
                <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <h1 className="text-lg font-bold text-gradient glow-text whitespace-nowrap">Deep Research</h1>
                </div>
            </div>

            {/* Collapsible Sidebar */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{
                    x: 0,
                    opacity: 1,
                    width: isOpen ? '16rem' : '0rem'
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`fixed left-0 top-0 h-screen bg-slate-950 border-r border-slate-800 flex flex-col overflow-hidden z-40 ${isOpen ? 'shadow-2xl' : ''
                    }`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-800 mt-20">
                    <button
                        onClick={onNewChat}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-medium text-sm">New Research</span>
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">
                            Resources
                        </h3>
                        <div className="space-y-0.5">
                            <div
                                className={`sidebar-item ${currentConversationId && conversations.find(c => c.id === currentConversationId)
                                    ? 'sidebar-item-active'
                                    : ''
                                    }`}
                                onClick={() => {
                                    // Scroll to current conversation in the list
                                    if (currentConversationId) {
                                        const element = document.getElementById(`conversation-${currentConversationId}`);
                                        element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                    }
                                }}
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <span>Current Chat</span>
                            </div>
                            <div
                                className="sidebar-item"
                                onClick={() => {
                                    alert('Research Library - Coming Soon!\n\nThis feature will allow you to:\n• Save and organize research sessions\n• Access saved conversations\n• Export research findings');
                                }}
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>Research Library</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div>
                            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">
                                Recent Sessions
                            </h3>
                            <div className="space-y-0.5">
                                {conversations.length === 0 ? (
                                    <p className="text-xs text-slate-600 px-3 py-2">No recent sessions</p>
                                ) : (
                                    conversations.map((conversation) => (
                                        <div
                                            key={conversation.id}
                                            id={`conversation-${conversation.id}`}
                                            className={`relative group ${conversation.id === currentConversationId
                                                ? 'sidebar-item sidebar-item-active'
                                                : 'sidebar-item'
                                                }`}
                                            onClick={() => onSelectConversation(conversation.id)}
                                            onMouseEnter={() => setHoveredId(conversation.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                        >
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm truncate">{conversation.title}</p>
                                                <p className="text-xs text-slate-500">{formatDate(conversation.updatedAt)}</p>
                                            </div>

                                            {hoveredId === conversation.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Delete this conversation?')) {
                                                            onDeleteConversation(conversation.id);
                                                        }
                                                    }}
                                                    className="flex-shrink-0 p-1 hover:bg-red-900/50 rounded transition-colors"
                                                    title="Delete conversation"
                                                >
                                                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>                        </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-800">
                    <div className="flex items-center space-x-2 px-2 py-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                            U
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">User</p>
                            <p className="text-xs text-slate-500">Research Assistant</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
