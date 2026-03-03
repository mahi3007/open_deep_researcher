import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MessageBubble from './components/MessageBubble';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import TiltedCard from './components/TiltedCard';
import ShinyText from './components/ShinyText';
import ResearchPlan from './components/ResearchPlan';
import ResearchCard from './components/ResearchCard';
import ResearchSidePanel from './components/ResearchSidePanel';
import FloatingLines from './components/FloatingLines';
import MetricsDashboard from './components/MetricsDashboard';
import { motion, AnimatePresence } from 'framer-motion';
const API_BASE_URL = 'http://127.0.0.1:8000'; // Direct backend URL to bypass proxy issues

function App() {
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [pendingPlan, setPendingPlan] = useState(null);
    const [sidePanelOpen, setSidePanelOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showDashboard, setShowDashboard] = useState(false);
    const messagesEndRef = useRef(null);

    // Sidebar collapse state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarPinned, setIsSidebarPinned] = useState(false);
    const hoverTimeoutRef = useRef(null);

    // Load conversations from backend on mount
    useEffect(() => {
        console.log('[DEBUG] App mounted, loading conversations...');
        loadConversationsFromBackend();
    }, []);

    // Save conversations to localStorage whenever they change (for offline cache)
    useEffect(() => {
        if (conversations.length > 0) {
            console.log('[DEBUG] Saving to localStorage:', conversations[0]?.messages.map(m => ({ role: m.role })));
            localStorage.setItem('research_conversations', JSON.stringify(conversations));
        }
    }, [conversations]);

    // Migrate old message format to new format
    const migrateMessages = (messages) => {
        console.log('[DEBUG] migrateMessages called with:', messages.length, 'messages');
        const migrated = messages.map(msg => {
            // Parse JSON content for plan and research_result messages
            if (msg.role === 'plan' && typeof msg.content === 'string') {
                try {
                    const parsedContent = JSON.parse(msg.content);
                    console.log('[DEBUG] Parsed plan message:', { plan_title: parsedContent.plan_title, sub_questions_count: parsedContent.sub_questions?.length });
                    return { ...msg, content: parsedContent };
                } catch (e) {
                    console.error('[ERROR] Error parsing plan message content:', e, msg.content.substring(0, 100));
                    return msg;
                }
            } else if (msg.role === 'research_result') {
                // Handle research_result messages - content might be string (from DB) or object (from localStorage)
                if (typeof msg.content === 'string') {
                    try {
                        const parsedContent = JSON.parse(msg.content);
                        console.log('[DEBUG] Parsed research_result - title:', parsedContent.title, '| summary:', parsedContent.summary, '| has_response:', !!parsedContent.response);
                        return {
                            ...msg,
                            content: parsedContent.response,
                            title: parsedContent.title,
                            summary: parsedContent.summary
                        };
                    } catch (e) {
                        console.error('[ERROR] Error parsing research_result message content:', e, msg.content.substring(0, 100));
                        return msg;
                    }
                } else if (typeof msg.content === 'object' && msg.content !== null) {
                    // Content is already an object, check if it needs restructuring
                    if (msg.content.response) {
                        console.log('[DEBUG] Restructuring research_result message from object');
                        return {
                            ...msg,
                            content: msg.content.response,
                            title: msg.content.title || msg.title,
                            summary: msg.content.summary || msg.summary
                        };
                    }
                }
                // If message already has title and summary at top level, it's good
                if (msg.title && msg.summary) {
                    console.log('[DEBUG] Research_result message already has title and summary');
                    return msg;
                }
                // Fallback: create default title and summary if missing
                console.warn('[WARN] Research_result message missing title/summary, adding defaults');
                return {
                    ...msg,
                    title: msg.title || 'Research Report',
                    summary: msg.summary || 'Research completed'
                };
            }
            return msg;
        }).filter(msg => {
            // Keep user, assistant, plan, research_result, and status messages
            return msg.role === 'user' || msg.role === 'assistant' ||
                msg.role === 'plan' || msg.role === 'research_result' || msg.role === 'status';
        });
        console.log('[DEBUG] Migrated messages:', migrated.map(m => ({ role: m.role, hasContent: !!m.content })));
        return migrated;
    };

    // Load conversations from backend
    const loadConversationsFromBackend = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/conversations`);
            const backendConversations = response.data;
            console.log('[DEBUG] Loaded from backend:', backendConversations.length, 'conversations');

            if (backendConversations.length > 0) {
                // Migrate messages in all conversations
                const migratedConversations = backendConversations.map(conv => ({
                    ...conv,
                    messages: migrateMessages(conv.messages || [])
                }));

                console.log('[DEBUG] Most recent conversation messages:', migratedConversations[0].messages.map(m => ({ role: m.role })));
                setConversations(migratedConversations);
                const mostRecent = migratedConversations[0];
                setCurrentConversationId(mostRecent.id);
                setMessages(mostRecent.messages);
                setSessionId(mostRecent.session_id);
            } else {
                // No conversations in backend, create a new one
                console.log('[DEBUG] No conversations found, creating new one');
                createNewConversation();
            }
        } catch (error) {
            console.error('Error loading conversations from backend:', error);
            // Fallback to localStorage
            const savedConversations = localStorage.getItem('research_conversations');
            console.log('[DEBUG] Falling back to localStorage');
            if (savedConversations) {
                const parsed = JSON.parse(savedConversations);
                console.log('[DEBUG] Loaded from localStorage:', parsed.length, 'conversations');
                // Migrate messages in localStorage conversations too
                const migratedConversations = parsed.map(conv => ({
                    ...conv,
                    messages: migrateMessages(conv.messages || [])
                }));
                console.log('[DEBUG] Most recent localStorage conversation messages:', migratedConversations[0]?.messages.map(m => ({ role: m.role })));
                setConversations(migratedConversations);
                if (migratedConversations.length > 0) {
                    const mostRecent = migratedConversations[0];
                    setCurrentConversationId(mostRecent.id);
                    setMessages(mostRecent.messages);
                    setSessionId(mostRecent.sessionId);
                }
            } else {
                console.log('[DEBUG] No localStorage data, creating new conversation');
                createNewConversation();
            }
        }
    };

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const createNewConversation = async () => {
        console.log('[DEBUG] createNewConversation called');
        const newSessionId = uuidv4();
        const newConversation = {
            id: uuidv4(),
            session_id: newSessionId,
            sessionId: newSessionId,  // Keep for backward compatibility
            title: 'New Research',
            messages: [],
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString(),  // Keep for backward compatibility
            updated_at: new Date().toISOString(),
            updatedAt: new Date().toISOString(),  // Keep for backward compatibility
        };

        console.log('[DEBUG] New conversation created:', { id: newConversation.id, sessionId: newSessionId });

        // Save to backend
        try {
            await axios.post(`${API_BASE_URL}/conversations`, {
                id: newConversation.id,
                session_id: newSessionId,
                title: 'New Research'
            });
        } catch (error) {
            console.error('[ERROR] Failed to create conversation in backend:', error);
        }

        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversationId(newConversation.id);
        setSessionId(newSessionId);
        setMessages([]);

        console.log('[DEBUG] Conversation state updated:', {
            conversationId: newConversation.id,
            sessionId: newSessionId,
            conversationsCount: 1
        });

        // Store session ID for backend
        localStorage.setItem('research_session_id', newSessionId);

        return { id: newConversation.id, sessionId: newSessionId };
    };

    const switchConversation = (conversationId) => {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            setCurrentConversationId(conversationId);
            setMessages(conversation.messages);
            setSessionId(conversation.sessionId);
            localStorage.setItem('research_session_id', conversation.sessionId);
        }
    };

    const updateConversationTitle = async (conversationId, firstMessage) => {
        // Generate title from first message (first 50 chars)
        const title = firstMessage.length > 50
            ? firstMessage.substring(0, 50) + '...'
            : firstMessage;

        // Update in backend
        try {
            await axios.put(`${API_BASE_URL}/conversations/${conversationId}`, { title });
        } catch (error) {
            console.error('Error updating conversation title:', error);
        }

        setConversations(prev => prev.map(conv =>
            conv.id === conversationId
                ? { ...conv, title, updatedAt: new Date().toISOString(), updated_at: new Date().toISOString() }
                : conv
        ));
    };

    const updateCurrentConversation = (newMessages, conversationId = currentConversationId) => {
        // Save ALL messages including plan and research_result for proper persistence
        console.log('[DEBUG] Saving messages to conversation:', newMessages.map(m => ({ role: m.role, hasContent: !!m.content })));
        setConversations(prev => prev.map(conv =>
            conv.id === conversationId
                ? { ...conv, messages: newMessages, updatedAt: new Date().toISOString() }
                : conv
        ));
    };

    const deleteConversation = async (conversationId) => {
        // Delete from backend
        try {
            await axios.delete(`${API_BASE_URL}/conversations/${conversationId}`);
        } catch (error) {
            console.error('Error deleting conversation from backend:', error);
        }

        setConversations(prev => {
            const filtered = prev.filter(c => c.id !== conversationId);

            // If we deleted the current conversation, switch to another or create new
            if (conversationId === currentConversationId) {
                if (filtered.length > 0) {
                    const newCurrent = filtered[0];
                    setCurrentConversationId(newCurrent.id);
                    setMessages(newCurrent.messages);
                    setSessionId(newCurrent.sessionId || newCurrent.session_id);
                } else {
                    createNewConversation();
                }
            }

            return filtered;
        });
    };

    const handleSendMessage = async (messageText) => {
        if (!messageText.trim()) return;

        let activeSessionId = sessionId;
        let activeConversationId = currentConversationId;

        // Ensure we have an active session
        if (!activeSessionId || !activeConversationId) {
            console.log('[DEBUG] No active session, creating new one...');
            const newSession = await createNewConversation();
            activeSessionId = newSession.sessionId;
            activeConversationId = newSession.id;
        }

        console.log('[DEBUG] handleSendMessage using:', {
            activeSessionId,
            activeConversationId
        });

        // Add user message to chat
        const userMessage = {
            role: 'user',
            content: messageText,
            timestamp: new Date().toISOString(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        updateCurrentConversation(newMessages, activeConversationId);

        // Save user message to backend
        try {
            await axios.post(`${API_BASE_URL}/conversations/${activeConversationId}/messages`, {
                role: 'user',
                content: messageText,
                timestamp: userMessage.timestamp
            });
        } catch (error) {
            console.error('[ERROR] Failed to save user message to backend:', error.response?.data || error.message);
        }

        // Update conversation title if this is the first message
        if (messages.length === 0) {
            updateConversationTitle(activeConversationId, messageText);
        }

        setIsLoading(true);

        try {
            // Add a status message to show research is starting
            const statusMessage = {
                role: 'status',
                content: '🧠 Deep Research Agent active: Analyzing query and starting iterative research...',
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, statusMessage]);

            // Call the full research pipeline directly
            const response = await axios.post(`${API_BASE_URL}/research`, {
                message: messageText,
                session_id: activeSessionId,
            }, {
                timeout: 600000 // 10 minutes timeout for deep research
            });

            const data = response.data;

            // Construct research result message with metrics
            const researchResultMessage = {
                role: 'research_result',
                content: data.response,
                title: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
                summary: `Research completed on: ${messageText.substring(0, 30)}...`,
                timestamp: data.timestamp,
                // Add advanced metrics
                metrics: {
                    iteration_count: data.iteration_count,
                    evidence_scores: data.evidence_scores,
                    orchestrator_decision: data.orchestrator_decision,
                    critique_decision: data.critique_decision,
                    sub_questions: data.sub_questions
                }
            };

            // Update messages: Remove status, add result
            const finalMessages = [...newMessages, researchResultMessage];
            setMessages(finalMessages);
            updateCurrentConversation(finalMessages, activeConversationId);

            // Save research_result message to backend
            try {
                await axios.post(`${API_BASE_URL}/conversations/${activeConversationId}/messages`, {
                    role: 'research_result',
                    content: JSON.stringify({
                        response: data.response,
                        title: researchResultMessage.title,
                        summary: researchResultMessage.summary,
                        metrics: researchResultMessage.metrics
                    }),
                    timestamp: data.timestamp
                });
                console.log('[DEBUG] Research_result message saved successfully');
            } catch (error) {
                console.error('[ERROR] Failed to save research_result message to backend:', error.response?.data || error.message);
            }

        } catch (err) {
            console.error('Error executing research:', err);

            let errorMessage = 'Failed to execute research. Please try again.';

            if (err.response) {
                errorMessage = `Error: ${err.response.data.detail || err.response.statusText}`;
            } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                errorMessage = 'Request timed out. The research is taking too long — try a simpler query, or increase the timeout.';
            } else if (err.request) {
                errorMessage = 'Cannot connect to server. Make sure the backend is running on http://localhost:8000';
            }

            // Add error message to chat
            const errorMsg = {
                role: 'assistant',
                content: `⚠️ **Error**: ${errorMessage}`,
                timestamp: new Date().toISOString(),
            };

            const updatedMessages = [...newMessages, errorMsg];
            setMessages(updatedMessages);
            updateCurrentConversation(updatedMessages);
        } finally {
            setIsLoading(false);
        }
    };

    // Deprecated: simplify start research since we now do it in one step
    const handleStartResearch = () => { };

    const handleEditPlan = () => {
        // TODO: Implement plan editing functionality
        alert('Plan editing will be implemented in a future update. For now, you can send a new message to generate a different plan.');
    };

    const handleOpenReport = (report) => {
        setSelectedReport(report);
        setSidePanelOpen(true);
    };

    const handleCloseSidePanel = () => {
        setSidePanelOpen(false);
        setTimeout(() => setSelectedReport(null), 300); // Clear after animation
    };

    const handleClearChat = () => {
        if (window.confirm('Are you sure you want to clear this conversation?')) {
            const clearedMessages = [];
            setMessages(clearedMessages);
            updateCurrentConversation(clearedMessages);
        }
    };

    // Sidebar interaction handlers
    const handleSidebarToggle = () => {
        const newPinnedState = !isSidebarPinned;
        setIsSidebarPinned(newPinnedState);
        setIsSidebarOpen(newPinnedState);

        // Clear any pending hover timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const handleSidebarMouseEnter = () => {
        // Open sidebar on hover if not pinned
        if (!isSidebarPinned) {
            setIsSidebarOpen(true);
        }

        // Clear any pending close timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const handleSidebarMouseLeave = () => {
        // Only close on hover leave if not pinned
        if (!isSidebarPinned) {
            // Add delay before closing to prevent flickering
            hoverTimeoutRef.current = setTimeout(() => {
                setIsSidebarOpen(false);
            }, 250); // 250ms delay
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 relative overflow-hidden">
            {/* Floating Lines Background */}
            <FloatingLines
                linesGradient={["#E945F5", "#2F4BC0", "#E945F5"]}
                animationSpeed={1}
                interactive
                bendRadius={5}
                bendStrength={-0.5}
                mouseDamping={0.05}
                parallax
                parallaxStrength={0.2}
            />

            {/* Sidebar */}
            <Sidebar
                conversations={conversations}
                currentConversationId={currentConversationId}
                onNewChat={createNewConversation}
                onSelectConversation={switchConversation}
                onDeleteConversation={deleteConversation}
                onOpenDashboard={() => setShowDashboard(true)}
                isOpen={isSidebarOpen}
                onToggle={handleSidebarToggle}
                onMouseEnter={handleSidebarMouseEnter}
                onMouseLeave={handleSidebarMouseLeave}
            />

            {/* Main Content - Split View */}
            <div className="flex-1 flex flex-row h-screen overflow-hidden relative z-10">
                {/* Conversation Area */}
                <motion.div
                    className="flex flex-col h-full"
                    animate={{
                        width: sidePanelOpen ? '40%' : '100%'
                    }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                >
                    <Header onClearChat={handleClearChat} />

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-12 pb-6">
                        <div className="max-w-4xl mx-auto">
                            {messages.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center mt-16"
                                >
                                    <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-teal-500/50">
                                        <svg
                                            className="w-10 h-10 text-white"
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
                                    <h2 className="text-3xl font-bold mb-3">
                                        <ShinyText
                                            text="Welcome to Deep Research AI"
                                            speed={3}
                                            className="text-3xl font-bold"
                                        />
                                    </h2>
                                    <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
                                        Ask me anything and I'll conduct comprehensive research using advanced AI agents.
                                        I can help you explore complex topics, analyze trends, and provide detailed insights.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                                        {[
                                            { icon: '🔍', title: 'Deep Research', desc: 'Multi-source analysis', color: 'from-teal-900/50 to-teal-800/50' },
                                            { icon: '🧠', title: 'AI-Powered', desc: 'LangGraph pipeline', color: 'from-purple-900/50 to-purple-800/50' },
                                            { icon: '💬', title: 'Conversational', desc: 'Context-aware responses', color: 'from-blue-900/50 to-blue-800/50' },
                                        ].map((feature, idx) => (
                                            <TiltedCard
                                                key={idx}
                                                rotateAmplitude={12}
                                                scaleOnHover={1.08}
                                            >
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.1 + 0.2 }}
                                                    className={`glass bg-gradient-to-br ${feature.color} rounded-xl p-5 text-center shadow-lg transition-shadow duration-300`}
                                                >
                                                    <div className="text-3xl mb-2">{feature.icon}</div>
                                                    <h3 className="font-semibold text-slate-200 mb-1">{feature.title}</h3>
                                                    <p className="text-sm text-slate-400">{feature.desc}</p>
                                                </motion.div>
                                            </TiltedCard>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <AnimatePresence>
                                    {messages.map((message, index) => {
                                        if (message.role === 'plan') {
                                            return (
                                                <ResearchPlan
                                                    key={index}
                                                    plan={message.content}
                                                    onStartResearch={handleStartResearch}
                                                    onEditPlan={handleEditPlan}
                                                />
                                            );
                                        } else if (message.role === 'research_result') {
                                            console.log('[DEBUG] Rendering research_result - title:', message.title, '| summary:', message.summary, '| content type:', typeof message.content);
                                            return (
                                                <div key={index} className="mb-4">
                                                    <ResearchCard
                                                        title={message.title}
                                                        summary={message.summary}
                                                        metrics={message.metrics}
                                                        onClick={() => handleOpenReport(message)}
                                                    />
                                                </div>
                                            );
                                        } else if (message.role === 'status') {
                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex justify-center my-4"
                                                >
                                                    <div className="glass bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                                                        <span className="text-slate-300 text-sm font-medium">{message.content}</span>
                                                    </div>
                                                </motion.div>
                                            );
                                        } else {
                                            return (
                                                <MessageBubble
                                                    key={index}
                                                    message={message}
                                                    isUser={message.role === 'user'}
                                                />
                                            );
                                        }
                                    })}
                                </AnimatePresence>
                            )}

                            {isLoading && <TypingIndicator />}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <ChatInput onSend={handleSendMessage} disabled={isLoading} />
                </motion.div>

                {/* Research Side Panel */}
                <ResearchSidePanel
                    isOpen={sidePanelOpen}
                    onClose={handleCloseSidePanel}
                    report={selectedReport}
                />

                <AnimatePresence>
                    {showDashboard && (
                        <MetricsDashboard
                            conversations={conversations}
                            onClose={() => setShowDashboard(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default App;
