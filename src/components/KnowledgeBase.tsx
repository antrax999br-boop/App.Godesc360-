import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  Plus,
  Search,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Edit3,
  Trash2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  X,
  Tag,
  Save,
  Globe,
  Lock,
  Layers
} from 'lucide-react';

interface ArticleItem {
  id: string;
  title: string;
  category: string;
  status: 'Publicado' | 'Rascunho';
  createdAuthor: string;
  createdDate: string;
  updatedAuthor: string;
  updatedDate: string;
  content: string;
}

interface CategoryGroup {
  name: string;
  articles: ArticleItem[];
}

const INITIAL_KB_DATA: CategoryGroup[] = [
  {
    name: 'AMABALIS',
    articles: [
      {
        id: 'art-1',
        title: 'PLANILHA DE ADMINISTRAÇÃO',
        category: 'AMABALIS',
        status: 'Publicado',
        createdAuthor: 'Fernando',
        createdDate: '23/07/2025',
        updatedAuthor: 'Fernando',
        updatedDate: '30/01/2026',
        content: `(SERVIDOR - GOCLOUD)
FUNÇÃO: FILE SERVER
IP: 10.1.1.121
USUÁRIO: suporte.godesc
SENHA: SupGo@Desc31072023*
MAPEAMENTO: \\\\10.1.1.121\\amabilis$

--------------------------------------------------------------------------------

(ROTEADOR WI-FI VIVO)
IP: 192.168.15.1
ADMIN: admin
SENHA: 4f5a2451
SSID: AMABALIS
SENHA: jgv02051997
SERVIDOR DHCP

--------------------------------------------------------------------------------

(IMPRESSORA)
MARCA / MODELO: EPSON L14150 SERIES
IP / COMPARTILHAMENTO: 192.168.15.10
SENHA: P@ssw0rd

--------------------------------------------------------------------------------

(OPERADORA DE INTERNET)
LINK ÚNICO: VIVO
NÚMERO: 103 15
QUANTIDADE DE MEGA: 300 MEGA

--------------------------------------------------------------------------------

Amabilis

Link: VIVO
IP: 192.168.15.1
Usuário: admin
Senha: 3ce8a4d4

ROTEADOR TPLINK AC1200 (SALA ROBÓTICA)
IP: 192.168.15.2
Usuário: admin
Senha: adm#C031072023*
WF: AMABALIS`
      }
    ]
  },
  {
    name: 'CASARI IMOVEIS',
    articles: [
      {
        id: 'art-2',
        title: 'CONFIGURAÇÕES DE REDE E SERVIDORES',
        category: 'CASARI IMOVEIS',
        status: 'Publicado',
        createdAuthor: 'Lucas TI',
        createdDate: '15/08/2025',
        updatedAuthor: 'Fernando',
        updatedDate: '12/01/2026',
        content: `(SERVIDOR LOCAL)
FUNÇÃO: ACTIVE DIRECTORY & FILE SERVER
IP: 192.168.1.10
DOMÍNIO: casari.local
USUÁRIO ADMIN: casari\\suporte`
      }
    ]
  },
  {
    name: 'CIRCUIT FIRE',
    articles: [
      {
        id: 'art-3',
        title: 'CREDENCIAS DE ACESSO E CFTV',
        category: 'CIRCUIT FIRE',
        status: 'Publicado',
        createdAuthor: 'Carlos TI',
        createdDate: '10/09/2025',
        updatedAuthor: 'Carlos TI',
        updatedDate: '05/02/2026',
        content: `(DVR INTELBRAS 16 CH)
IP: 192.168.2.200
PORTA HTTP: 8080
PORTA SERVIÇO: 37777`
      }
    ]
  },
  {
    name: 'COBRANDS',
    articles: [
      {
        id: 'art-4',
        title: 'CONTAS DE EMAIL E HOSPEDAGEM',
        category: 'COBRANDS',
        status: 'Publicado',
        createdAuthor: 'Laércio TI',
        createdDate: '01/10/2025',
        updatedAuthor: 'Fernando',
        updatedDate: '20/01/2026',
        content: `(PAINEL DESCMAIL)
DOMÍNIO: cobrands.com.br
SERVIDORES IMAP: mail.desccloud.com (993)
SMTP: mail.desccloud.com (465)`
      }
    ]
  },
  {
    name: 'CONCEITO ZOE',
    articles: [
      {
        id: 'art-5',
        title: 'MAPEAMENTO DE REDE E IMPRESSORAS',
        category: 'CONCEITO ZOE',
        status: 'Publicado',
        createdAuthor: 'Fernando',
        createdDate: '12/11/2025',
        updatedAuthor: 'Fernando',
        updatedDate: '28/01/2026',
        content: `(IMPRESSORA HP M428fdw)
IP: 192.168.0.50
FILA DE IMPRESSÃO: \\\\SERVER-ZOE\\HP-M428`
      }
    ]
  },
  {
    name: 'CONCILIATO',
    articles: [
      {
        id: 'art-6',
        title: 'ROTEADORES E GATEWAYS DE INTERNET',
        category: 'CONCILIATO',
        status: 'Publicado',
        createdAuthor: 'Lucas TI',
        createdDate: '05/12/2025',
        updatedAuthor: 'Lucas TI',
        updatedDate: '15/01/2026',
        content: `(MIKROTIK CHR PROD)
IP INTERNO: 10.0.0.1
GATEWAY SECUNDÁRIO: 10.0.0.254`
      }
    ]
  },
  {
    name: 'DE MOURA E PROT...',
    articles: [
      {
        id: 'art-7',
        title: 'INFRAESTRUTURA DE BACKUP',
        category: 'DE MOURA E PROT...',
        status: 'Publicado',
        createdAuthor: 'Carlos TI',
        createdDate: '20/12/2025',
        updatedAuthor: 'Carlos TI',
        updatedDate: '10/02/2026',
        content: `(NAS SYNOLOGY BACKUP)
IP: 192.168.10.250
VOLUME TOTAL: 12 TB RAID 5`
      }
    ]
  },
  {
    name: 'DISCOVERY CHEM',
    articles: [
      {
        id: 'art-8',
        title: 'SENHAS DE APLICAÇÃO E BANCO DE DADOS',
        category: 'DISCOVERY CHEM',
        status: 'Publicado',
        createdAuthor: 'Fernando',
        createdDate: '02/01/2026',
        updatedAuthor: 'Fernando',
        updatedDate: '02/01/2026',
        content: `(POSTGRESQL DB)
HOST: 10.2.0.15
PORT: 5432
DB: discovery_db`
      }
    ]
  },
  {
    name: 'DR ACARO',
    articles: [
      {
        id: 'art-9',
        title: 'PLANO DE MANUTENÇÃO E WI-FI',
        category: 'DR ACARO',
        status: 'Publicado',
        createdAuthor: 'Laércio TI',
        createdDate: '10/01/2026',
        updatedAuthor: 'Laércio TI',
        updatedDate: '10/01/2026',
        content: `(ROTEADOR UNIFI UNIFI-AP-6)
IP: 192.168.3.10
SSID CORPORATIVO: DrAcaro_Corp`
      }
    ]
  },
  {
    name: 'DR MARCELO DI M...',
    articles: [
      {
        id: 'art-10',
        title: 'PRONTUÁRIO E SERVIDOR DE ARQUIVOS',
        category: 'DR MARCELO DI M...',
        status: 'Publicado',
        createdAuthor: 'Fernando',
        createdDate: '15/01/2026',
        updatedAuthor: 'Fernando',
        updatedDate: '15/01/2026',
        content: `(SERVIDOR CLINICA)
IP: 192.168.15.50
MAPEAMENTO: \\\\192.168.15.50\\prontuarios$`
      }
    ]
  },
  {
    name: 'FENIX CONTABIL',
    articles: [
      {
        id: 'art-11',
        title: 'CONFIGURAÇÕES FISCAIS E DOMÍNIO',
        category: 'FENIX CONTABIL',
        status: 'Publicado',
        createdAuthor: 'Lucas TI',
        createdDate: '18/01/2026',
        updatedAuthor: 'Lucas TI',
        updatedDate: '18/01/2026',
        content: `(SERVIDORES DE SISTEMA CONTÁBIL)
IP: 10.5.0.20
SISTEMA: Domínio Sistemas`
      }
    ]
  },
  {
    name: 'FIT CONTABIL',
    articles: []
  },
  {
    name: 'FMD',
    articles: []
  },
  {
    name: 'FOCO EM SEGUROS',
    articles: []
  },
  {
    name: 'GODESC',
    articles: [
      {
        id: 'art-12',
        title: 'INFRAESTRUTURA INTERNA GODESC 360',
        category: 'GODESC',
        status: 'Publicado',
        createdAuthor: 'Administrador TI',
        createdDate: '01/01/2025',
        updatedAuthor: 'Fernando',
        updatedDate: '10/02/2026',
        content: `(SERVIDORES GODESC CLOUD)
KUBERNETES MASTER: 10.0.0.100
CLUSTER REDUNDANTE SÃO PAULO / RIO DE JANEIRO`
      }
    ]
  },
  {
    name: 'INTELECT',
    articles: []
  },
  {
    name: 'JMAZZETTO',
    articles: []
  },
  {
    name: 'MONILOG',
    articles: []
  },
  {
    name: 'MSO',
    articles: []
  },
  {
    name: 'PETROCABOS',
    articles: []
  }
];

export const KnowledgeBase: React.FC = () => {
  const { setCurrentScreen } = useApp();
  const [categoriesData, setCategoriesData] = useState<CategoryGroup[]>(INITIAL_KB_DATA);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    AMABALIS: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(
    INITIAL_KB_DATA[0].articles[0]
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showNewCatModal, setShowNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Form states for active article editing/creation
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editFormat, setEditFormat] = useState('Normal');
  const [editFont, setEditFont] = useState('Sans Serif');

  const totalCategoriesCount = categoriesData.length;

  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleSelectArticle = (art: ArticleItem) => {
    setSelectedArticle(art);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (!selectedArticle) return;
    setEditTitle(selectedArticle.title);
    setEditCategory(selectedArticle.category);
    setEditContent(selectedArticle.content);
    setIsEditing(true);
  };

  const handleCreateNewArticle = () => {
    const defaultCat = selectedArticle ? selectedArticle.category : categoriesData[0]?.name || 'GODESC';
    const newArt: ArticleItem = {
      id: `art-${Date.now()}`,
      title: 'NOVO ARTIGO SEM TÍTULO',
      category: defaultCat,
      status: 'Publicado',
      createdAuthor: 'Fernando',
      createdDate: new Date().toLocaleDateString('pt-BR'),
      updatedAuthor: 'Fernando',
      updatedDate: new Date().toLocaleDateString('pt-BR'),
      content: ''
    };

    setEditTitle(newArt.title);
    setEditCategory(newArt.category);
    setEditContent('');
    setSelectedArticle(newArt);
    setIsEditing(true);
  };

  const handleSaveArticle = () => {
    if (!selectedArticle) return;

    const updatedArt: ArticleItem = {
      ...selectedArticle,
      title: editTitle.toUpperCase(),
      category: editCategory,
      content: editContent,
      updatedAuthor: 'Fernando',
      updatedDate: new Date().toLocaleDateString('pt-BR')
    };

    setCategoriesData((prev) => {
      // Remove article from old placement if category changed
      const cleaned = prev.map((cat) => ({
        ...cat,
        articles: cat.articles.filter((a) => a.id !== updatedArt.id)
      }));

      // Add to target category
      return cleaned.map((cat) => {
        if (cat.name === updatedArt.category) {
          return {
            ...cat,
            articles: [updatedArt, ...cat.articles]
          };
        }
        return cat;
      });
    });

    setSelectedArticle(updatedArt);
    setIsEditing(false);
  };

  const handleDeleteArticle = () => {
    if (!selectedArticle) return;
    if (confirm(`Tem certeza que deseja excluir o artigo "${selectedArticle.title}"?`)) {
      setCategoriesData((prev) =>
        prev.map((cat) => ({
          ...cat,
          articles: cat.articles.filter((a) => a.id !== selectedArticle.id)
        }))
      );
      setSelectedArticle(null);
      setIsEditing(false);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const formattedName = newCatName.trim().toUpperCase();
    if (!categoriesData.some((c) => c.name === formattedName)) {
      setCategoriesData((prev) => [...prev, { name: formattedName, articles: [] }]);
      setExpandedCategories((prev) => ({ ...prev, [formattedName]: true }));
    }
    setNewCatName('');
    setShowNewCatModal(false);
  };

  // Helper formatting for editor toolbar text manipulation
  const applyTextFormat = (prefix: string, suffix: string = '') => {
    setEditContent((prev) => prev + `${prefix}Texto${suffix}`);
  };

  return (
    <div className="min-h-screen bg-[#18181b] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Top Header */}
      <header className="bg-[#18181b] border-b border-[#27272a] px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-xs font-mono text-[#c3c6d7] hover:text-[#45dfa4] flex items-center gap-1.5 transition-all cursor-pointer bg-[#27272a] px-3 py-1.5 rounded-lg border border-[#45dfa4]/40 hover:border-[#45dfa4] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar ao Dashboard</span>
          </button>
          <span className="text-[#434655]">|</span>
          <h1 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
            <Globe className="w-4 h-4 text-[#45dfa4]" />
            <span>Base de Conhecimento</span>
          </h1>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR TREE VIEW */}
        <aside className="w-80 sm:w-84 bg-[#141416] border-r border-[#27272a] flex flex-col shrink-0 select-none">
          {/* Action Buttons Header */}
          <div className="p-4 border-b border-[#27272a] space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateNewArticle}
                className="flex-1 py-2 px-3 bg-white hover:bg-gray-100 text-gray-950 font-bold text-xs rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Artigo</span>
              </button>

              <button
                onClick={() => setShowNewCatModal(true)}
                className="flex-1 py-2 px-3 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-white font-bold text-xs rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Folder className="w-3.5 h-3.5 text-[#45dfa4]" />
                <span>+ Categoria</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar artigos..."
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#45dfa4] text-white text-xs rounded-lg py-2 pl-9 pr-3 focus:outline-none placeholder:text-[#8d90a0]"
              />
            </div>
          </div>

          {/* Tree View Header */}
          <div className="px-4 py-2 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between text-[11px] font-mono text-[#8d90a0]">
            <span>Categorias ({totalCategoriesCount})</span>
            <Layers className="w-3.5 h-3.5 text-[#45dfa4]" />
          </div>

          {/* Category Tree Navigation Scroll Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
            {/* Top Root item: CLIENTES */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5 text-[#c3c6d7] hover:text-white rounded font-mono font-bold cursor-pointer hover:bg-[#27272a]">
                <div className="flex items-center gap-1.5">
                  <ChevronDown className="w-3.5 h-3.5 text-[#8d90a0]" />
                  <Folder className="w-3.5 h-3.5 text-blue-400" />
                  <span className="tracking-wide">CLIENTES</span>
                </div>
                <span className="text-[10px] text-[#8d90a0] font-normal">(0)</span>
              </div>

              {/* Nested Client Categories */}
              <div className="pl-4 space-y-0.5 border-l border-[#27272a]/60 ml-3">
                {categoriesData
                  .filter((cat) => {
                    if (!searchTerm.trim()) return true;
                    const catMatch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const artMatch = cat.articles.some((a) =>
                      a.title.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    return catMatch || artMatch;
                  })
                  .map((cat) => {
                    const isExpanded = expandedCategories[cat.name] || Boolean(searchTerm.trim());
                    const articlesCount = cat.articles.length;

                    return (
                      <div key={cat.name} className="space-y-0.5">
                        {/* Category Row */}
                        <div
                          onClick={() => toggleCategory(cat.name)}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded text-[#c3c6d7] hover:text-white hover:bg-[#27272a]/60 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#8d90a0]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-[#8d90a0]" />
                            )}
                            <Folder className="w-3.5 h-3.5 text-[#45dfa4]" />
                            <span className="truncate font-medium">{cat.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#8d90a0]">
                            ({articlesCount})
                          </span>
                        </div>

                        {/* Articles in Category */}
                        {isExpanded && cat.articles.length > 0 && (
                          <div className="pl-5 space-y-0.5 border-l border-[#27272a]/40 ml-4">
                            {cat.articles.map((art) => {
                              const isSelected = selectedArticle?.id === art.id;
                              return (
                                <div
                                  key={art.id}
                                  onClick={() => handleSelectArticle(art)}
                                  className={`p-2 rounded flex flex-col gap-1 cursor-pointer transition-all border ${
                                    isSelected
                                      ? 'bg-[#27272a] border-[#45dfa4]/60 text-white shadow-sm'
                                      : 'hover:bg-[#27272a]/60 border-transparent text-[#c3c6d7] hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-[#45dfa4]" />
                                    <span className="text-xs font-bold font-mono tracking-tight truncate leading-tight">
                                      {art.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 pl-5">
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-[#45dfa4] border border-emerald-500/30">
                                      {art.status}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN WORKSPACE */}
        <main className="flex-1 bg-[#18181b] flex flex-col overflow-y-auto">
          {selectedArticle ? (
            <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
              {/* Metadata Bar & Top Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272a]">
                <div className="text-xs font-mono text-[#8d90a0]">
                  Criado por <span className="text-white font-semibold">{selectedArticle.createdAuthor}</span> em{' '}
                  <span className="text-white">{selectedArticle.createdDate}</span> • Atualizado em{' '}
                  <span className="text-white">{selectedArticle.updatedDate}</span> Por{' '}
                  <span className="text-white font-semibold">{selectedArticle.updatedAuthor}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-[#45dfa4] border border-emerald-500/30">
                    {selectedArticle.status}
                  </span>

                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-[#27272a] text-[#c3c6d7] border border-[#3f3f46]">
                    {isEditing ? editCategory : selectedArticle.category}
                  </span>

                  {!isEditing ? (
                    <>
                      <button
                        onClick={handleStartEdit}
                        className="px-3 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-semibold rounded border border-[#3f3f46] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#45dfa4]" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={handleDeleteArticle}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded border border-red-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Deletar</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleSaveArticle}
                      className="px-3.5 py-1.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar Artigo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Title Section */}
              <div className="space-y-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-mono text-[#8d90a0] block mb-1">Título do Artigo</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#45dfa4] text-white text-lg font-bold rounded-lg p-3 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono text-[#8d90a0] block mb-1">Categoria do Cliente</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#45dfa4] text-white text-xs rounded-lg p-2.5 focus:outline-none font-mono"
                      >
                        {categoriesData.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide uppercase font-mono">
                      {selectedArticle.title}
                    </h1>
                    <p className="text-xs text-[#8d90a0] font-mono">
                      Categoria: <span className="text-white font-semibold">{selectedArticle.category}</span>
                    </p>
                  </>
                )}
              </div>

              {/* RICH TEXT EDITOR / VIEWER SECTION ("igual ate na parte de escrever") */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Conteúdo</h3>

                <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl">
                  {/* RICH TEXT FORMATTING TOOLBAR */}
                  <div className="p-2.5 bg-[#141416] border-b border-[#27272a] flex flex-wrap items-center gap-1.5 text-xs text-[#c3c6d7]">
                    {/* Format Selector Dropdown */}
                    <select
                      value={editFormat}
                      onChange={(e) => setEditFormat(e.target.value)}
                      className="bg-[#27272a] text-white text-xs rounded px-2.5 py-1.5 border border-[#3f3f46] focus:outline-none font-sans cursor-pointer"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Título 1">Título 1</option>
                      <option value="Título 2">Título 2</option>
                      <option value="Título 3">Título 3</option>
                    </select>

                    <span className="text-[#3f3f46]">|</span>

                    {/* Inline formatting */}
                    <button
                      type="button"
                      onClick={() => applyTextFormat('**', '**')}
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors font-bold"
                      title="Negrito (B)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => applyTextFormat('*', '*')}
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors italic"
                      title="Itálico (I)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => applyTextFormat('<u>', '</u>')}
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors underline"
                      title="Sublinhado (U)"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => applyTextFormat('~~', '~~')}
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors line-through"
                      title="Tachado (G)"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[#3f3f46]">|</span>

                    {/* Alignments */}
                    <button
                      type="button"
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors"
                      title="Alinhar à Esquerda"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors"
                      title="Centralizar"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors"
                      title="Alinhar à Direita"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors"
                      title="Justificar"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[#3f3f46]">|</span>

                    {/* Lists */}
                    <button
                      type="button"
                      onClick={() => applyTextFormat('\n- ')}
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors"
                      title="Lista de Marcadores"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => applyTextFormat('\n1. ')}
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors"
                      title="Lista Numerada"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[#3f3f46]">|</span>

                    {/* Font Selector */}
                    <select
                      value={editFont}
                      onChange={(e) => setEditFont(e.target.value)}
                      className="bg-[#27272a] text-white text-xs rounded px-2.5 py-1.5 border border-[#3f3f46] focus:outline-none font-mono cursor-pointer"
                    >
                      <option value="Sans Serif">Sans Serif</option>
                      <option value="Monospace">Monospace</option>
                      <option value="Serif">Serif</option>
                    </select>

                    <span className="text-[#3f3f46]">|</span>

                    {/* Code & Inserts */}
                    <button
                      type="button"
                      onClick={() => applyTextFormat('`', '`')}
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors font-mono"
                      title="Código / Monospace"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => applyTextFormat('[', '](url)')}
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors"
                      title="Inserir Link"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => applyTextFormat('\n--------------------------------------------------------------------------------\n')}
                      className="p-1.5 hover:bg-[#27272a] hover:text-white rounded transition-colors text-[10px] font-mono border border-[#3f3f46]"
                      title="Inserir Linha Divisória"
                    >
                      ---
                    </button>
                  </div>

                  {/* CONTENT TEXTAREA / DISPLAY */}
                  {isEditing ? (
                    <textarea
                      rows={20}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Digite aqui as instruções, IP, usuários, senhas ou documentação..."
                      className="w-full p-5 bg-[#141416] text-white text-xs font-mono leading-relaxed focus:outline-none resize-y min-h-[400px]"
                    />
                  ) : (
                    <div className="p-6 bg-[#141416] text-xs font-mono leading-relaxed text-white space-y-2 whitespace-pre-wrap selection:bg-[#45dfa4]/30">
                      {selectedArticle.content || 'Nenhum conteúdo cadastrado.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8d90a0]">
              <FileText className="w-12 h-12 text-[#27272a] mb-3" />
              <h3 className="text-base font-bold text-white">Nenhum artigo selecionado</h3>
              <p className="text-xs max-w-sm mt-1">
                Selecione uma categoria na barra lateral para visualizar a documentação ou clique em + Artigo para criar um novo.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Nova Categoria */}
      {showNewCatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-[#45dfa4]" />
                <h3 className="text-base font-bold text-white">Adicionar Nova Categoria</h3>
              </div>
              <button
                onClick={() => setShowNewCatModal(false)}
                className="text-[#8d90a0] hover:text-white text-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#8d90a0] block mb-1">
                  Nome da Empresa / Categoria
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: NOME DA EMPRESA"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-[#141416] border border-[#27272a] focus:border-[#45dfa4] text-white text-xs rounded-xl p-3 focus:outline-none placeholder:text-[#8d90a0] font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setShowNewCatModal(false)}
                  className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar Categoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
