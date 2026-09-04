import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChatbotFlow, ChatbotNode, ChatbotOption } from '../types';
import {
  Bot,
  Play,
  Save,
  CheckCircle2,
  Plus,
  GitFork,
  Trash2,
  Edit3,
  X,
  Send,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';

export const AttendanceChatbotView: React.FC = () => {
  const { chatbotFlow, saveChatbotFlow, publishChatbotFlow, setCurrentScreen } = useApp();

  const [flow, setFlow] = useState<ChatbotFlow>(chatbotFlow);
  const [editingNode, setEditingNode] = useState<ChatbotNode | null>(null);
  
  // Simulator State
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorInput, setSimulatorInput] = useState('');
  const [simulatorChat, setSimulatorChat] = useState<Array<{ sender: 'USER' | 'BOT'; text: string }>>([]);

  const handleSaveDraft = () => {
    saveChatbotFlow({ ...flow, status: 'DRAFT' });
    alert('Rascunho do Chatbot salvo com sucesso!');
  };

  const handlePublish = () => {
    const updatedFlow = { ...flow, status: 'PUBLISHED' as const, version: (flow.version || 1) + 1 };
    setFlow(updatedFlow);
    publishChatbotFlow(updatedFlow);
    alert('Fluxo do Chatbot PUBLICADO com sucesso! As novas opções já estão ativas.');
  };

  // Node editing handlers
  const handleOpenEditNode = (node: ChatbotNode) => {
    setEditingNode(JSON.parse(JSON.stringify(node))); // Deep clone for safe editing
  };

  const handleAddOptionToEditingNode = () => {
    if (!editingNode) return;
    const nextTrigger = (editingNode.options.length + 1).toString();
    const newOpt: ChatbotOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      triggerValue: nextTrigger,
      label: `Nova Opção ${nextTrigger}`,
      targetNodeId: ''
    };
    setEditingNode({
      ...editingNode,
      options: [...editingNode.options, newOpt]
    });
  };

  const handleRemoveOptionFromEditingNode = (optId: string) => {
    if (!editingNode) return;
    setEditingNode({
      ...editingNode,
      options: editingNode.options.filter(o => o.id !== optId)
    });
  };

  const handleSaveEditedNode = () => {
    if (!editingNode) return;
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => (n.id === editingNode.id ? editingNode : n))
    }));
    setEditingNode(null);
  };

  const handleCreateNewNode = () => {
    const newId = `node-${Date.now()}`;
    const newNode: ChatbotNode = {
      id: newId,
      title: `Menu Adicional ${flow.nodes.length + 1}`,
      type: 'MENU',
      message: 'Digite uma opção:\n\n1 - Atendimento Técnico\n2 - Voltar',
      options: [
        { id: `opt-${Date.now()}-1`, triggerValue: '1', label: 'Atendimento Técnico', targetNodeId: '' },
        { id: `opt-${Date.now()}-2`, triggerValue: '2', label: 'Voltar ao Menu Principal', targetNodeId: 'node-start' }
      ],
      position: { x: 100, y: 100 }
    };

    setFlow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setEditingNode(newNode);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (flow.nodes.length <= 1) {
      alert('O menu principal inicial não pode ser removido.');
      return;
    }
    if (confirm('Tem certeza que deseja excluir este menu do robô?')) {
      setFlow(prev => ({
        ...prev,
        nodes: prev.nodes.filter(n => n.id !== nodeId)
      }));
    }
  };

  // Simulator Logic
  const startSimulator = () => {
    const rootNode = flow.nodes.find(n => n.type === 'START' || n.type === 'MENU' || n.id === 'node-start') || flow.nodes[0];
    setSimulatorChat([
      { sender: 'BOT', text: rootNode?.message || 'Olá! Como posso te ajudar?' }
    ]);
    setShowSimulator(true);
  };

  const handleSimulatorSend = () => {
    if (!simulatorInput.trim()) return;
    const userText = simulatorInput.trim();
    const newChat = [...simulatorChat, { sender: 'USER' as const, text: userText }];

    const rootNode = flow.nodes.find(n => n.type === 'START' || n.type === 'MENU' || n.id === 'node-start') || flow.nodes[0];
    const matchedOpt = rootNode?.options?.find(o => o.triggerValue.trim() === userText);

    let botReply = '';
    if (matchedOpt) {
      botReply = `Perfeito! Você selecionou a opção **[${matchedOpt.triggerValue}] ${matchedOpt.label}**. Redirecionando para a fila correspondente! 💼`;
    } else {
      botReply = `Opção não reconhecida. Por favor digite uma das opções do menu inicial.`;
    }

    newChat.push({ sender: 'BOT', text: botReply });
    setSimulatorChat(newChat);
    setSimulatorInput('');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header with Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="p-2.5 bg-[#27272a] hover:bg-[#323238] text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar</span>
          </button>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Construtor de Fluxo do Chatbot
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                flow.status === 'PUBLISHED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {flow.status === 'PUBLISHED' ? `v${flow.version || 1} PUBLICADO` : 'RASCUNHO'}
              </span>
            </h1>
            <p className="text-xs text-[#8d90a0]">
              Crie e edite as opções e mensagens interativas do robô no WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={startSimulator}
            className="px-4 py-2.5 bg-[#27272a] hover:bg-[#323238] text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 text-[#45dfa4]" />
            Testar Chatbot
          </button>

          <button
            onClick={handleSaveDraft}
            className="px-4 py-2.5 bg-[#27272a] hover:bg-[#323238] text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Salvar Rascunho
          </button>

          <button
            onClick={handlePublish}
            className="px-4 py-2.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-[#45dfa4]/20"
          >
            <CheckCircle2 className="w-4 h-4 text-gray-950" />
            Publicar Fluxo
          </button>
        </div>
      </div>

      {/* Action Bar for Adding Nodes */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-[#8d90a0]">
          Menus e Nós do Robô
        </h3>
        <button
          onClick={handleCreateNewNode}
          className="px-3.5 py-2 bg-[#45dfa4]/10 hover:bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30 rounded-xl text-xs font-bold font-mono cursor-pointer transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Adicionar Novo Menu / Nó
        </button>
      </div>

      {/* Visual Flow Builder Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flow.nodes.map(node => (
          <div
            key={node.id}
            className="p-5 bg-[#141416] border border-[#27272a] rounded-2xl space-y-4 relative group hover:border-[#45dfa4]/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <GitFork className="w-4 h-4 text-[#45dfa4]" />
                {node.title}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEditNode(node)}
                  className="p-1.5 bg-[#27272a] hover:bg-[#45dfa4]/20 hover:text-[#45dfa4] text-[#8d90a0] rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
                  title="Editar Nó"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-mono">Editar</span>
                </button>
                <button
                  onClick={() => handleDeleteNode(node.id)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-all cursor-pointer"
                  title="Excluir Nó"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Node Message Preview */}
            <div className="space-y-1">
              <span className="text-[10px] text-[#8d90a0] font-mono uppercase">Mensagem de Resposta:</span>
              <p className="text-xs text-[#dfe2eb] bg-[#1e1e24] p-3 rounded-xl border border-[#27272a] font-mono whitespace-pre-wrap leading-relaxed">
                {node.message}
              </p>
            </div>

            {/* Menu Options List */}
            {node.options && node.options.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] text-[#8d90a0] font-mono uppercase">Opções de Seleção do Cliente:</span>
                <div className="space-y-1.5">
                  {node.options.map(opt => (
                    <div
                      key={opt.id}
                      className="text-xs p-2 bg-[#1e1e24] rounded-xl border border-[#27272a] flex items-center justify-between text-white font-mono"
                    >
                      <span className="text-[#45dfa4] font-bold">
                        Tecla [{opt.triggerValue}]: <span className="text-white font-normal">{opt.label}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Node Edit Modal */}
      {editingNode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#45dfa4]" />
                Editar Menu / Opções do Robô
              </h3>
              <button
                onClick={() => setEditingNode(null)}
                className="text-[#8d90a0] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs text-[#8d90a0] block font-mono mb-1">Título do Menu:</label>
                <input
                  type="text"
                  value={editingNode.title}
                  onChange={e => setEditingNode({ ...editingNode, title: e.target.value })}
                  className="w-full bg-[#141416] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#45dfa4]"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs text-[#8d90a0] block font-mono mb-1">Mensagem enviada ao cliente:</label>
                <textarea
                  rows={4}
                  value={editingNode.message}
                  onChange={e => setEditingNode({ ...editingNode, message: e.target.value })}
                  className="w-full bg-[#141416] border border-[#27272a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#45dfa4] font-mono leading-relaxed"
                  placeholder="Ex: Olá! Digite uma opção:\n1 - Comercial\n2 - Suporte"
                />
              </div>

              {/* Options Section */}
              <div className="space-y-3 pt-2 border-t border-[#27272a]">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[#8d90a0] font-mono uppercase font-bold">Opções Numéricas do Menu:</label>
                  <button
                    type="button"
                    onClick={handleAddOptionToEditingNode}
                    className="px-2.5 py-1 bg-[#45dfa4]/10 hover:bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Opção
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {editingNode.options.map((opt, idx) => (
                    <div
                      key={opt.id}
                      className="p-3 bg-[#141416] border border-[#27272a] rounded-xl flex items-center gap-2 flex-wrap sm:flex-nowrap"
                    >
                      <div className="w-16">
                        <span className="text-[10px] text-[#8d90a0] block font-mono">Tecla:</span>
                        <input
                          type="text"
                          value={opt.triggerValue}
                          onChange={e => {
                            const newOpts = [...editingNode.options];
                            newOpts[idx].triggerValue = e.target.value;
                            setEditingNode({ ...editingNode, options: newOpts });
                          }}
                          className="w-full bg-[#1e1e24] border border-[#27272a] rounded-lg px-2 py-1 text-xs text-center font-bold text-[#45dfa4] focus:outline-none"
                        />
                      </div>

                      <div className="flex-1 min-w-[150px]">
                        <span className="text-[10px] text-[#8d90a0] block font-mono">Nome / Descrição da Opção:</span>
                        <input
                          type="text"
                          value={opt.label}
                          onChange={e => {
                            const newOpts = [...editingNode.options];
                            newOpts[idx].label = e.target.value;
                            setEditingNode({ ...editingNode, options: newOpts });
                          }}
                          className="w-full bg-[#1e1e24] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOptionFromEditingNode(opt.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer self-end mb-0.5"
                        title="Remover Opção"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#27272a] pt-4">
              <button
                type="button"
                onClick={() => setEditingNode(null)}
                className="px-4 py-2 bg-[#27272a] hover:bg-[#323238] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditedNode}
                className="px-5 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-[#45dfa4]/20"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#45dfa4]" />
                Simulador de Teste do Chatbot
              </h3>
              <button
                onClick={() => setShowSimulator(false)}
                className="text-[#8d90a0] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-80 overflow-y-auto bg-[#141416] p-4 rounded-xl space-y-3 border border-[#27272a]">
              {simulatorChat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-xl text-xs whitespace-pre-wrap ${
                      msg.sender === 'USER'
                        ? 'bg-[#45dfa4] text-gray-950 font-semibold'
                        : 'bg-[#1e1e24] text-white border border-[#27272a]'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Digite uma tecla (1, 2, 3...) para testar..."
                value={simulatorInput}
                onChange={e => setSimulatorInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSimulatorSend()}
                className="flex-1 bg-[#1e1e24] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white placeholder-[#8d90a0] focus:outline-none focus:border-[#45dfa4]"
              />
              <button
                onClick={handleSimulatorSend}
                className="p-2 bg-[#45dfa4] text-gray-950 rounded-xl font-bold transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
