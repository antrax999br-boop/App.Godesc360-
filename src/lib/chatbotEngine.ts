import {
  AttendanceConversation,
  AttendanceMessage,
  ChatbotFlow,
  BusinessHoursConfig,
  AttendanceQueue,
  Ticket
} from '../types';

export interface ChatbotProcessingResult {
  replyMessage?: string;
  updateConversationStatus?: 'WAITING' | 'IN_PROGRESS' | 'BOT' | 'TRANSFERRED' | 'CLOSED';
  targetQueueId?: string;
  targetQueueName?: string;
  botActive?: boolean;
  createTicketData?: {
    title: string;
    description: string;
    category: string;
  };
}

export class ChatbotEngine {
  public static isWithinBusinessHours(config?: BusinessHoursConfig): { isWorking: boolean; outMessage: string } {
    try {
      if (!config || !config.enabled) {
        return { isWorking: true, outMessage: '' };
      }

      const defaultMsg = config.outOfHoursMessage || 'Olá! Nosso horário de atendimento é de segunda a sexta-feira, das 08:00 às 18:00.';

      if (!config.schedules || !Array.isArray(config.schedules) || config.schedules.length === 0) {
        return { isWorking: true, outMessage: '' };
      }

      // Usar fuso horário do Brasil (America/Sao_Paulo)
      const now = new Date();
      let brDate: Date;
      try {
        const brTimeString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
        brDate = new Date(brTimeString);
        if (isNaN(brDate.getTime())) brDate = now;
      } catch (e) {
        brDate = now;
      }

      const daysMap: Record<number, string> = {
        0: 'Domingo',
        1: 'Segunda-feira',
        2: 'Terça-feira',
        3: 'Quarta-feira',
        4: 'Quinta-feira',
        5: 'Sexta-feira',
        6: 'Sábado'
      };

      const dayName = daysMap[brDate.getDay()];
      const schedule = config.schedules.find(s => s && s.day === dayName);

      if (!schedule || !schedule.enabled) {
        return {
          isWorking: false,
          outMessage: defaultMsg
        };
      }

      const currentMinutes = brDate.getHours() * 60 + brDate.getMinutes();

      // Sanitiza openTime e closeTime com fallback seguro
      const openTime = (schedule.openTime && typeof schedule.openTime === 'string' && schedule.openTime.includes(':'))
        ? schedule.openTime
        : '08:00';
      const closeTime = (schedule.closeTime && typeof schedule.closeTime === 'string' && schedule.closeTime.includes(':'))
        ? schedule.closeTime
        : '18:00';

      const [openH, openM] = openTime.split(':').map(Number);
      const openMinutes = (isNaN(openH) ? 8 : openH) * 60 + (isNaN(openM) ? 0 : openM);

      const [closeH, closeM] = closeTime.split(':').map(Number);
      const closeMinutes = (isNaN(closeH) ? 18 : closeH) * 60 + (isNaN(closeM) ? 0 : closeM);

      if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
        return {
          isWorking: false,
          outMessage: defaultMsg
        };
      }

      // Check lunch break de forma segura
      if (schedule.hasLunchBreak && schedule.lunchStart && schedule.lunchEnd &&
          typeof schedule.lunchStart === 'string' && schedule.lunchStart.includes(':') &&
          typeof schedule.lunchEnd === 'string' && schedule.lunchEnd.includes(':')) {
        const [lStartH, lStartM] = schedule.lunchStart.split(':').map(Number);
        const lStartMinutes = (isNaN(lStartH) ? 12 : lStartH) * 60 + (isNaN(lStartM) ? 0 : lStartM);

        const [lEndH, lEndM] = schedule.lunchEnd.split(':').map(Number);
        const lEndMinutes = (isNaN(lEndH) ? 13 : lEndH) * 60 + (isNaN(lEndM) ? 0 : lEndM);

        if (currentMinutes >= lStartMinutes && currentMinutes <= lEndMinutes) {
          return {
            isWorking: false,
            outMessage: 'Estamos em horário de almoço no momento. Retornaremos em breve!'
          };
        }
      }

      return { isWorking: true, outMessage: '' };
    } catch (err) {
      console.warn('Erro ao verificar horário de atendimento:', err);
      return { isWorking: true, outMessage: '' };
    }
  }

  public static processIncomingMessage(
    incomingText: string,
    conversation: AttendanceConversation,
    flow: ChatbotFlow,
    businessHours?: BusinessHoursConfig,
    queues: AttendanceQueue[] = []
  ): ChatbotProcessingResult {
    // 1. Check Operating Hours with Brazil timezone
    const hoursCheck = this.isWithinBusinessHours(businessHours);
    if (!hoursCheck.isWorking) {
      return {
        replyMessage: hoursCheck.outMessage || 'Olá! Nosso horário de atendimento é de segunda a sexta-feira, das 08:00 às 18:00.',
        updateConversationStatus: 'WAITING',
        targetQueueName: 'Fora do Expediente',
        botActive: false
      };
    }

    // If bot is paused (human attendant engaged and not waiting), bot should not intercept
    if (!conversation.botActive && conversation.status === 'IN_PROGRESS') {
      return {};
    }

    const trimmed = incomingText.trim();
    const lowerTrimmed = trimmed.toLowerCase();

    // Comandos de reinício de menu a qualquer momento
    const isMenuRestart = ['menu', 'início', 'inicio', '#', 'voltar', 'opções', 'opcoes', 'ajuda', 'começar', 'comecar'].includes(lowerTrimmed);

    // Build welcome message from rootNode message if present, or default fallback
    const welcomeMsg = rootNode?.message || `Olá! Tudo bem? 👋\n\nBem-vindo à Central de Atendimento GoDesc 360.\n\nPara direcionarmos seu atendimento à equipe correta, por favor digite o número da opção desejada:\n\n1 - 💼 Comercial\n2 - 🛠️ Suporte Técnico\n3 - 💳 Financeiro\n4 - 🎫 Abrir Ticket Chamado\n5 - 👤 Falar com Atendente\n\n_(A qualquer momento, digite *#* ou *menu* para retornar ao início)_`;

    // Se o cliente digitar comando de reinício, reseta para o menu principal
    if (isMenuRestart) {
      return {
        replyMessage: welcomeMsg,
        updateConversationStatus: 'BOT',
        targetQueueName: 'Triagem Automática',
        botActive: true
      };
    }

    // Se o atendente humano estiver ativamente engajado (IN_PROGRESS) e o robô pausado, não intercepta mensagens normais
    if (!conversation.botActive && conversation.status === 'IN_PROGRESS') {
      return {};
    }

    // Check if customized flow nodes exist
    const rootNode = (flow && flow.nodes && flow.nodes.length > 0)
      ? (flow.nodes.find(n => n.type === 'START' || n.type === 'MENU' || n.id === 'node-start') || flow.nodes[0])
      : null;

    // Dynamically match user option against flow rootNode options if present
    if (rootNode && rootNode.options && rootNode.options.length > 0) {
      const matchedOpt = rootNode.options.find(o => 
        o.triggerValue.trim().toLowerCase() === lowerTrimmed || 
        o.label.trim().toLowerCase() === lowerTrimmed
      );

      if (matchedOpt) {
        const targetNode = flow.nodes.find(n => n.id === matchedOpt.targetNodeId);
        const optLabelLower = matchedOpt.label.toLowerCase();
        
        // Find matching queue
        const targetQueue = queues.find(q => 
          q.name.toLowerCase().includes(optLabelLower) || 
          (targetNode?.targetDepartment && q.name.toLowerCase().includes(targetNode.targetDepartment.toLowerCase()))
        ) || queues[0];

        if (optLabelLower.includes('ticket') || optLabelLower.includes('chamado') || targetNode?.type === 'TICKET_CREATE') {
          return {
            replyMessage: targetNode?.message || `Geramos um chamado de suporte técnico automático para seu atendimento! 🎫\n\nNosso sistema registrou suas informações e um técnico entrará em contato.`,
            updateConversationStatus: 'WAITING',
            targetQueueName: targetQueue?.name || 'Suporte Técnico',
            botActive: false,
            createTicketData: {
              title: `Chamado via WhatsApp: ${conversation.contactName}`,
              description: `Solicitação via WhatsApp por ${conversation.contactName} (${conversation.contactPhone})`,
              category: 'Suporte Geral'
            }
          };
        }

        if (optLabelLower.includes('atendente') || optLabelLower.includes('humano') || targetNode?.type === 'HUMAN_ATTENDANT') {
          return {
            replyMessage: targetNode?.message || `Você solicitou atendimento humano. Você foi inserido na fila de espera e o primeiro analista disponível irá te atender. 👤`,
            updateConversationStatus: 'WAITING',
            targetQueueName: targetQueue?.name || 'Fila Geral',
            botActive: false
          };
        }

        // Standard Queue transfer for menu choices (e.g. Comercial, Suporte, Financeiro, etc)
        return {
          replyMessage: targetNode?.message || `Perfeito! Vou encaminhar você para a fila do setor *${matchedOpt.label}*. Por favor, aguarde um momento. ⏳`,
          updateConversationStatus: 'WAITING',
          targetQueueId: targetQueue?.id,
          targetQueueName: targetQueue?.name || matchedOpt.label,
          botActive: false
        };
      }
    }

    // Process fallback numerical or keyword options if flow options didn't match
    if (lowerTrimmed === '1' || lowerTrimmed === 'comercial' || lowerTrimmed.includes('vendas')) {
      const q = queues.find(item => item.name.toLowerCase().includes('comercial')) || queues[0];
      return {
        replyMessage: `Perfeito! Vou encaminhar você para a fila do setor *Comercial*. Por favor, aguarde um momento. ⏳`,
        updateConversationStatus: 'WAITING',
        targetQueueId: q?.id,
        targetQueueName: q?.name || 'Comercial',
        botActive: false
      };
    }

    if (lowerTrimmed === '2' || lowerTrimmed === 'suporte' || lowerTrimmed.includes('tecnico') || lowerTrimmed.includes('técnico') || lowerTrimmed.includes('ajuda')) {
      const q = queues.find(item => item.name.toLowerCase().includes('suporte')) || queues[0];
      return {
        replyMessage: `Certo! Vou encaminhar você para a fila de *Suporte Técnico*. Em instantes um analista assumirá seu atendimento. 🛠️`,
        updateConversationStatus: 'WAITING',
        targetQueueId: q?.id,
        targetQueueName: q?.name || 'Suporte Técnico',
        botActive: false
      };
    }

    if (lowerTrimmed === '3' || lowerTrimmed === 'financeiro' || lowerTrimmed.includes('boleto') || lowerTrimmed.includes('pagamento') || lowerTrimmed.includes('fatura')) {
      const q = queues.find(item => item.name.toLowerCase().includes('financeiro')) || queues[0];
      return {
        replyMessage: `Entendido! Redirecionando seu contato para o departamento *Financeiro*. 💳`,
        updateConversationStatus: 'WAITING',
        targetQueueId: q?.id,
        targetQueueName: q?.name || 'Financeiro',
        botActive: false
      };
    }

    if (lowerTrimmed === '4' || lowerTrimmed === 'ticket' || lowerTrimmed === 'chamado' || lowerTrimmed.includes('abrir chamado')) {
      return {
        replyMessage: `Geramos um chamado de suporte técnico automático para seu atendimento! 🎫\n\nNosso sistema registrou suas informações e um técnico entrará em contato.`,
        updateConversationStatus: 'WAITING',
        targetQueueName: 'Suporte Técnico',
        botActive: false,
        createTicketData: {
          title: `Chamado via WhatsApp: ${conversation.contactName}`,
          description: `Solicitação via WhatsApp por ${conversation.contactName} (${conversation.contactPhone})`,
          category: 'Suporte Geral'
        }
      };
    }

    if (lowerTrimmed === '5' || lowerTrimmed === 'atendente' || lowerTrimmed.includes('humano') || lowerTrimmed.includes('falar com atendente') || lowerTrimmed.includes('pessoa')) {
      return {
        replyMessage: `Você solicitou atendimento humano. Você foi inserido na fila de espera e o primeiro analista disponível irá te atender. 👤`,
        updateConversationStatus: 'WAITING',
        targetQueueName: 'Fila Geral',
        botActive: false
      };
    }

    // Mensagem não reconhecida (saudação ou texto livre) -> Envia o menu de triagem
    return {
      replyMessage: welcomeMsg,
      updateConversationStatus: 'BOT',
      targetQueueName: 'Triagem Automática',
      botActive: true
    };
  }
}
