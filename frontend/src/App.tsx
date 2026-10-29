import React, { useState } from 'react';
import { Language, ChatMessage, CitationItem, DocumentItem } from './types';
import { Header } from './components/Header';
import { ChatFeed } from './components/ChatFeed';
import { WorkflowsView } from './components/WorkflowsView';
import { AdminPortal } from './components/AdminPortal';
import { SourceDrawer } from './components/SourceDrawer';
import { SettingsModal } from './components/SettingsModal';
import { sendChatMessage, getSourceDocument } from './services/api';

export const App: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('auto');
  const [activeTab, setActiveTab] = useState<'chat' | 'workflows' | 'admin'>('chat');
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState<string>(() => {
    const existing = localStorage.getItem('rvitm_session_id');
    if (existing) return existing;
    const newId = `sess_${Math.random().toString(36).substring(2, 12)}`;
    localStorage.setItem('rvitm_session_id', newId);
    return newId;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Voice Agent and Settings state
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Citation Drawer state
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);
  const [documentDetails, setDocumentDetails] = useState<DocumentItem | null>(null);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Switch to chat tab if coming from workflow prompt click
    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const resp = await sendChatMessage(text, currentLanguage, conversationId || undefined, sessionId);
      if (!conversationId) {
        setConversationId(resp.conversation_id);
      }

      const assistantMsg: ChatMessage = {
        id: resp.message_id,
        role: 'assistant',
        content: resp.answer,
        language: resp.language,
        status: resp.status as any,
        citations: resp.citations,
        suggested_followups: resp.suggested_followups,
        needs_clarification: resp.needs_clarification,
        retrieval_confidence: resp.retrieval_confidence,
        latency_ms: resp.latency_ms,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to connect to RVITM Mitra AI service. Please ensure the backend is running.'}`,
        status: 'insufficient_evidence',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCitation = async (citation: CitationItem) => {
    setSelectedCitation(citation);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const doc = await getSourceDocument(citation.document_id);
      setDocumentDetails(doc);
    } catch (e) {
      console.warn('Could not fetch full document detail', e);
    } finally {
      setDrawerLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak(prev => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'chat' && (
          <ChatFeed
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onSelectCitation={handleSelectCitation}
            conversationId={conversationId}
            autoSpeak={autoSpeak}
            currentLanguage={currentLanguage}
          />
        )}

        {activeTab === 'workflows' && (
          <WorkflowsView
            onStartChatQuery={handleSendMessage}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal />
        )}
      </main>

      {/* Expandable Source Evidence Drawer */}
      <SourceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        citation={selectedCitation}
        documentDetails={documentDetails}
        loading={drawerLoading}
      />

      {/* LLM & AI Engine Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
export default App;

