import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DatabaseNote, DatabaseFolder } from '../types';
import {
  Folder,
  FolderPlus,
  FileText,
  Plus,
  Search,
  Trash2,
  Edit3,
  Check,
  X,
  Pin,
  Copy,
  Clock,
  ArrowLeft,
  Tag,
  Save,
  Download,
  Share2,
  CheckSquare,
  List,
  Code,
  Sparkles,
  ChevronRight,
  Maximize2,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FOLDER_COLORS = [
  '#45dfa4', // Emerald
  '#38bdf8', // Sky
  '#fbbf24', // Amber
  '#f87171', // Rose
  '#c084fc', // Purple
  '#fb923c'  // Orange
];

export const DatabaseNotesView: React.FC = () => {
  const {
    folders,
    notes,
    addFolder,
    updateFolder,
    deleteFolder,
    addNote,
    updateNote,
    deleteNote,
    setCurrentScreen,
    userSession
  } = useApp();

  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Folder creation modal / inline
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

  // Folder rename modal
  const [editingFolder, setEditingFolder] = useState<DatabaseFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  // Tag input state for selected note
  const [tagInput, setTagInput] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Active selected note
  const activeNote = notes.find(n => n.id === selectedNoteId) || null;

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchFolder = selectedFolderId === 'all' || note.folderId === selectedFolderId;
    const matchSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchFolder && matchSearch;
  });

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const created = addFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName('');
    setIsCreatingFolder(false);
    setSelectedFolderId(created.id);
  };

  const handleUpdateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editFolderName.trim()) return;
    updateFolder(editingFolder.id, editFolderName.trim(), editingFolder.color);
    setEditingFolder(null);
    setEditFolderName('');
  };

  const handleCreateNote = () => {
    const targetFolderId = selectedFolderId !== 'all' ? selectedFolderId : (folders[0]?.id || 'fld-default');
    const created = addNote(targetFolderId, 'Nova Nota', '', ['Geral']);
    setSelectedNoteId(created.id);
  };

  const handleCopyNoteContent = () => {
    if (!activeNote) return;
    navigator.clipboard.writeText(`${activeNote.title}\n\n${activeNote.content}`);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!activeNote) return;
    const element = document.createElement('a');
    const file = new Blob([`${activeNote.title}\n\n${activeNote.content}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const insertTextFormatting = (prefix: string, suffix: string = '') => {
    if (!activeNote) return;
    const textarea = document.getElementById('note-notepad-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousText = activeNote.content;
    const selectedText = previousText.substring(start, end);
    const replacement = `${prefix}${selectedText || 'texto'}${suffix}`;

    const newContent = previousText.substring(0, start) + replacement + previousText.substring(end);
    updateNote(activeNote.id, { content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 5));
    }, 10);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() && activeNote) {
      e.preventDefault();
      const currentTags = activeNote.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        updateNote(activeNote.id, { tags: [...currentTags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return;
    updateNote(activeNote.id, {
      tags: activeNote.tags.filter(t => t !== tagToRemove)
    });
  };

  return (
    <div className="min-h-screen bg-[#0d141d] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Top Header */}
      <header className="bg-[#111827] border-b border-[#2A2F3A] px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-xs font-mono text-[#8d90a0] hover:text-[#45dfa4] flex items-center gap-1.5 transition-colors bg-[#181c22] px-3 py-1.5 rounded-lg border border-[#2A2F3A]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard TI</span>
          </button>
          <span className="text-[#434655]">|</span>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[#45dfa4]" />
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Base de Dados &amp; Bloco de Notas
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="px-3 py-1.5 bg-[#1f2630] hover:bg-[#283240] text-[#c3c6d7] hover:text-white border border-[#2A2F3A] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-[#45dfa4]" />
            <span className="hidden sm:inline">Nova Pasta</span>
          </button>

          <button
            onClick={handleCreateNote}
            className="px-3.5 py-1.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-[#45dfa4]/10"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nota</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-61px)]">
        {/* Left Column: Folders Directory (Pastas) */}
        <aside className="w-full md:w-64 bg-[#111827] border-r border-[#2A2F3A] flex flex-col p-4 shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono text-[#8d90a0] uppercase tracking-wider font-bold">
              Pastas ({folders.length})
            </span>
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="text-xs text-[#45dfa4] hover:underline flex items-center gap-1 font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar</span>
            </button>
          </div>

          {/* All Notes Button */}
          <button
            onClick={() => setSelectedFolderId('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors mb-1.5 ${
              selectedFolderId === 'all'
                ? 'bg-[#45dfa4]/10 text-[#45dfa4] border border-[#45dfa4]/30'
                : 'text-[#c3c6d7] hover:bg-[#181c22] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#8d90a0]" />
              <span>Todas as Notas</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#181c22] text-[#8d90a0]">
              {notes.length}
            </span>
          </button>

          {/* Folder List */}
          <div className="space-y-1 mt-1">
            {folders.map(folder => {
              const count = notes.filter(n => n.folderId === folder.id).length;
              const isSelected = selectedFolderId === folder.id;

              return (
                <div
                  key={folder.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#1f2630] text-white border border-[#45dfa4]/40'
                      : 'text-[#c3c6d7] hover:bg-[#181c22] hover:text-white'
                  }`}
                >
                  <button
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="flex items-center gap-2.5 flex-1 text-left truncate"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: folder.color || '#45dfa4' }}
                    />
                    <span className="truncate font-medium">{folder.name}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-[#8d90a0] px-1.5 py-0.5 rounded bg-[#181c22]/60">
                      {count}
                    </span>
                    <button
                      onClick={() => {
                        setEditingFolder(folder);
                        setEditFolderName(folder.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#8d90a0] hover:text-white transition-opacity"
                      title="Renomear Pasta"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {folders.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir a pasta "${folder.name}" e suas notas?`)) {
                            deleteFolder(folder.id);
                            if (selectedFolderId === folder.id) setSelectedFolderId('all');
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#8d90a0] hover:text-[#ffb4ab] transition-opacity"
                        title="Excluir Pasta"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-[#2A2F3A] text-[11px] text-[#8d90a0]">
            <p className="font-mono">💾 Base Local Persistente</p>
            <p className="mt-0.5 text-[10px] text-[#5e6375]">
              Documentação interna e bloco de notas do suporte GoDesc.
            </p>
          </div>
        </aside>

        {/* Middle Column: Notes List for Selected Folder */}
        <div className="w-full md:w-80 bg-[#151c25] border-r border-[#2A2F3A] flex flex-col shrink-0">
          {/* Search bar inside notes */}
          <div className="p-3 border-b border-[#2A2F3A]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar notas ou tags..."
                className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4]"
              />
            </div>
          </div>

          {/* Notes list cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#2A2F3A]/60">
            {filteredNotes.length > 0 ? (
              filteredNotes.map(note => {
                const isSelected = selectedNoteId === note.id;
                const folder = folders.find(f => f.id === note.folderId);

                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`p-3.5 cursor-pointer transition-colors relative ${
                      isSelected
                        ? 'bg-[#1f2630] border-l-2 border-[#45dfa4]'
                        : 'hover:bg-[#181c22]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-white truncate flex-1 flex items-center gap-1.5">
                        {note.isPinned && <Pin className="w-3 h-3 text-[#fbbf24] fill-[#fbbf24] shrink-0" />}
                        <span className="truncate">{note.title || 'Sem Título'}</span>
                      </h4>
                      <span className="text-[10px] font-mono text-[#8d90a0] shrink-0">
                        {note.updatedAt.replace('Hoje às ', '')}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#c3c6d7] line-clamp-2 leading-relaxed font-mono">
                      {note.content ? note.content.replace(/[#*`]/g, '') : '(Nota em branco...)'}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {folder && (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                            style={{
                              borderColor: `${folder.color || '#45dfa4'}40`,
                              color: folder.color || '#45dfa4',
                              backgroundColor: `${folder.color || '#45dfa4'}15`
                            }}
                          >
                            {folder.name}
                          </span>
                        )}
                        {note.tags.slice(0, 2).map((tg, i) => (
                          <span key={i} className="text-[9px] font-mono text-[#8d90a0] bg-[#111827] px-1.5 py-0.5 rounded">
                            #{tg}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Deseja excluir esta nota?')) {
                            deleteNote(note.id);
                            if (selectedNoteId === note.id) {
                              const remaining = notes.filter(n => n.id !== note.id);
                              setSelectedNoteId(remaining[0]?.id || null);
                            }
                          }
                        }}
                        className="p-1 text-[#8d90a0] hover:text-[#ffb4ab] opacity-60 hover:opacity-100 transition-opacity"
                        title="Excluir Nota"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-[#8d90a0] space-y-2">
                <FileText className="w-8 h-8 text-[#434655] mx-auto mb-2 opacity-50" />
                <p>Nenhuma nota encontrada nesta pasta.</p>
                <button
                  onClick={handleCreateNote}
                  className="text-xs text-[#45dfa4] font-semibold hover:underline font-mono"
                >
                  + Escrever Primeira Nota
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Full Bloco de Notas Notepad Editor */}
        <main className="flex-1 bg-[#0f151e] flex flex-col overflow-hidden">
          {activeNote ? (
            <>
              {/* Note Top Action Toolbar */}
              <div className="bg-[#111827] border-b border-[#2A2F3A] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  {/* Folder Selector */}
                  <select
                    value={activeNote.folderId}
                    onChange={e => updateNote(activeNote.id, { folderId: e.target.value })}
                    className="bg-[#181c22] border border-[#2A2F3A] text-white text-xs font-mono rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#45dfa4]"
                  >
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>

                  <span className="text-xs text-[#8d90a0] font-mono hidden sm:inline">
                    • Salvo automaticamente
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateNote(activeNote.id, { isPinned: !activeNote.isPinned })}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                      activeNote.isPinned
                        ? 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30'
                        : 'bg-[#181c22] text-[#8d90a0] border-[#2A2F3A] hover:text-white'
                    }`}
                    title={activeNote.isPinned ? 'Desafixar nota' : 'Fixar nota no topo'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{activeNote.isPinned ? 'Fixada' : 'Fixar'}</span>
                  </button>

                  <button
                    onClick={handleCopyNoteContent}
                    className="p-1.5 bg-[#181c22] hover:bg-[#1f2630] text-[#c3c6d7] hover:text-white border border-[#2A2F3A] rounded-lg text-xs flex items-center gap-1 transition-colors"
                    title="Copiar todo o texto"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{copiedNotification ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={handleDownloadTxt}
                    className="p-1.5 bg-[#181c22] hover:bg-[#1f2630] text-[#c3c6d7] hover:text-white border border-[#2A2F3A] rounded-lg text-xs flex items-center gap-1 transition-colors"
                    title="Baixar em .txt"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Exportar</span>
                  </button>
                </div>
              </div>

              {/* Note Title Input */}
              <div className="px-6 pt-5 pb-2">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={e => updateNote(activeNote.id, { title: e.target.value })}
                  placeholder="Título da Nota / Procedimento..."
                  className="w-full bg-transparent text-xl sm:text-2xl font-extrabold text-white placeholder:text-[#5e6375] focus:outline-none tracking-tight"
                />
              </div>

              {/* Tags & Metadata bar */}
              <div className="px-6 py-2 flex flex-wrap items-center gap-2 border-b border-[#2A2F3A]/40 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-[#8d90a0]" />
                  {activeNote.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-[#181c22] border border-[#2A2F3A] text-[#c3c6d7] px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-[#8d90a0] hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="+ Tag (Enter)"
                    className="bg-transparent text-[11px] font-mono text-[#45dfa4] placeholder:text-[#5e6375] focus:outline-none w-24"
                  />
                </div>

                <div className="ml-auto text-[11px] text-[#8d90a0] font-mono flex items-center gap-3">
                  <span>Autor: {activeNote.author}</span>
                  <span>•</span>
                  <span>Última alteração: {activeNote.updatedAt}</span>
                </div>
              </div>

              {/* Notepad Formatting Toolbar */}
              <div className="px-6 py-2 bg-[#111827]/80 border-b border-[#2A2F3A] flex flex-wrap items-center gap-1.5 text-xs text-[#8d90a0]">
                <button
                  type="button"
                  onClick={() => insertTextFormatting('**', '**')}
                  className="px-2 py-1 bg-[#181c22] hover:bg-[#1f2630] text-[#c3c6d7] rounded font-bold transition-colors"
                  title="Negrito (**texto**)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertTextFormatting('*', '*')}
                  className="px-2 py-1 bg-[#181c22] hover:bg-[#1f2630] text-[#c3c6d7] rounded italic transition-colors"
                  title="Itálico (*texto*)"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertTextFormatting('## ')}
                  className="px-2 py-1 bg-[#181c22] hover:bg-[#1f2630] text-[#c3c6d7] rounded font-mono transition-colors"
                  title="Título H2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertTextFormatting('- ')}
                  className="p-1.5 bg-[#181c22] hover:bg-[#1f2630] text-[#c3c6d7] rounded transition-colors"
                  title="Lista com marcadores"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextFormatting('[ ] ')}
                  className="p-1.5 bg-[#181c22] hover:bg-[#1f2630] text-[#c3c6d7] rounded transition-colors"
                  title="Checklist de tarefas"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextFormatting('```\n', '\n```')}
                  className="p-1.5 bg-[#181c22] hover:bg-[#1f2630] text-[#c3c6d7] rounded transition-colors"
                  title="Bloco de Código"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextFormatting(`📅 ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - `)}
                  className="px-2 py-1 bg-[#181c22] hover:bg-[#1f2630] text-[#45dfa4] font-mono text-[10px] rounded transition-colors"
                  title="Inserir Carimbo de Data e Hora"
                >
                  + Data/Hora
                </button>
              </div>

              {/* Note Notepad Area */}
              <div className="flex-1 p-6 overflow-hidden flex flex-col">
                <textarea
                  id="note-notepad-textarea"
                  value={activeNote.content}
                  onChange={e => updateNote(activeNote.id, { content: e.target.value })}
                  placeholder="Escreva aqui suas anotações técnicas, procedimentos, senhas de teste, comandos e documentação como um bloco de notas..."
                  className="w-full flex-1 bg-transparent text-[#dfe2eb] font-mono text-xs sm:text-sm leading-relaxed placeholder:text-[#5e6375] focus:outline-none resize-none overflow-y-auto"
                />
              </div>

              {/* Footer status bar */}
              <div className="bg-[#111827] border-t border-[#2A2F3A] px-6 py-2 flex items-center justify-between text-[11px] font-mono text-[#8d90a0]">
                <span>
                  {activeNote.content.length} caracteres | {activeNote.content.split(/\s+/).filter(Boolean).length} palavras
                </span>
                <span className="text-[#45dfa4] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Sincronizado</span>
                </span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8d90a0]">
              <FolderOpen className="w-16 h-16 text-[#2A2F3A] mb-4" />
              <h3 className="text-base font-bold text-white mb-1">Nenhuma nota selecionada</h3>
              <p className="text-xs max-w-sm mb-4">
                Selecione uma nota na lista ao lado ou crie um novo documento para começar a escrever no bloco de notas.
              </p>
              <button
                onClick={handleCreateNote}
                className="px-4 py-2 bg-[#45dfa4] text-gray-950 font-bold text-xs rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Nova Nota</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Create Folder */}
      {isCreatingFolder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181c22] border border-[#2A2F3A] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2F3A] mb-4">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#45dfa4]" />
                <h3 className="text-base font-bold text-white">Criar Nova Pasta</h3>
              </div>
              <button
                onClick={() => setIsCreatingFolder(false)}
                className="text-[#8d90a0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#8d90a0] mb-1.5">
                  Nome da Pasta *
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Ex: Senhas e Acessos, Backup, Procedimentos N1"
                  className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8d90a0] mb-2">
                  Cor da Pasta
                </label>
                <div className="flex items-center gap-3">
                  {FOLDER_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newFolderColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#2A2F3A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="px-4 py-2 bg-[#1f2630] hover:bg-[#283240] text-[#c3c6d7] text-xs font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#45dfa4] text-gray-950 text-xs font-bold rounded-lg hover:bg-[#00bd85]"
                >
                  Criar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename Folder */}
      {editingFolder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181c22] border border-[#2A2F3A] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2F3A] mb-4">
              <h3 className="text-base font-bold text-white">Renomear Pasta</h3>
              <button
                onClick={() => setEditingFolder(null)}
                className="text-[#8d90a0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#8d90a0] mb-1.5">
                  Novo Nome
                </label>
                <input
                  type="text"
                  required
                  value={editFolderName}
                  onChange={e => setEditFolderName(e.target.value)}
                  className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#45dfa4]"
                  autoFocus
                />
              </div>

              <div className="pt-4 border-t border-[#2A2F3A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  className="px-4 py-2 bg-[#1f2630] text-[#c3c6d7] text-xs font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#45dfa4] text-gray-950 text-xs font-bold rounded-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
