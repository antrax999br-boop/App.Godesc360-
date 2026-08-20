import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChatbotFlow, ChatbotNode } from '../types';
import {
  Bot,
  Play,
  Save,
  CheckCircle2,
  Plus,
  GitFork,
  MessageSquare,
  Sparkles,
  Layers,
  Ticket,
  UserCheck,
  X,
  Send,
  ArrowLeft
} from 'lucide-react';

export const AttendanceChatbotView: React.FC = () => {
  const { chatbotFlow, saveChatbotFlow, publishChatbotFlow, setCurrentScreen } = useApp();

  const [flow, setFlow] = useState<ChatbotFlow>(chatbotFlow);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorInput, setSimulatorInput] = useState('');
  const [simulatorChat, setSimulatorChat] = useState<Array<{ sender: 'USER' | 'BOT'; text: string }>>([
    { sender: 'BOT', text: 'Olá! Tudo bem? 👋\n\nSou o assistente virtual da Empresa XYZ.\n\nComo podemos ajudar?\n1 - Comercial\n2 - Suporte\n3 - Financeiro\n4 - Abrir Ticket\n5 - Falar com Atendente' }
  ]);

  const handleSaveDraft = () => {
    saveChatbotFlow({ ...flow, status: 'DRAFT' });
    alert('Rascunho do Chatbot salvo com sucesso!');
  };

  const handlePublish = () => {
    publishChatbotFlow({ ...flow, status: 'PUBLISHED', version: flow.version + 1 });
    alert('Fluxo do Chatbot PUBLICADO com sucesso para todos os atendimentos!');
  };

  const handleSimulatorSend = () => {
    if (!simulatorInput.trim()) return;
    const userText = simulatorInput.trim();
    const newChat = [...simulatorChat, { sender: 'USER' as const, text: userText }];

    let botReply = '';
    if (userText === '1') {
      botReply = 'Perfeito! Redirecionando para a fila do Comercial. 💼';
    } else if (userText === '2') {
      botReply = 'Certo! Você foi transferido para a fila de Suporte Técnico. 🛠️';
    } else if (userText === '3') {
      botReply = 'Entendido! Encaminhando você para o setor Financeiro. 💳';
    } else if (userText === '4') {
      botReply = 'Ticket de chamado aberto automaticamente! ID #000124. 🎫';
    } else if (userText === '5') {
      botReply = 'Você foi direcionado para atendimento humano. 👤';
    } else {
      botReply = 'Olá! Por favor escolha uma das opções válidas (1 a 5).';
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
                {flow.status === 'PUBLISHED' ? `v${flow.version} PUBLICADO` : 'RASCUNHO'}
              </span>
            </h1>
            <p className="text-xs text-[#8d90a0]">
              Crie a árvore interativa de navegação do robô para atendimento inicial via WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSimulator(true)}
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

      {/* Visual Flow Builder Nodes */}
      <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a] space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-[#8d90a0]">
          Árvore de Nós do Atendimento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {flow.nodes.map(node => (
            <div
              key={node.id}
              className="p-4 bg-[#141416] border border-[#27272a] rounded-xl space-y-3 relative group hover:border-[#45dfa4]/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#45dfa4] flex items-center gap-1.5">
                  <GitFork className="w-4 h-4" />
                  {node.title}
                </span>
                <span className="text-[10px] font-mono bg-[#27272a] text-[#8d90a0] px-2 py-0.5 rounded">
                  {node.type}
                </span>
              </div>

              <p className="text-xs text-[#dfe2eb] bg-[#1e1e24] p-3 rounded-lg border border-[#27272a] font-mono leading-relaxed">
                {node.message}
              </p>

              {node.options && node.options.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-[#8d90a0] font-mono uppercase">Opções do Menu:</span>
                  {node.options.map(opt => (
                    <div
                      key={opt.id}
                      className="text-xs p-1.5 bg-[#1e1e24] rounded border border-[#27272a] flex items-center justify-between text-white font-mono"
                    >
                      <span className="text-[#45dfa4] font-bold">[{opt.triggerValue}] {opt.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
                placeholder="Digite uma resposta para testar..."
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
