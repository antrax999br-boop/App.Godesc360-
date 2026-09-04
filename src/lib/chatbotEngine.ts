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
    if (!config || !config.enabled) {
      return { isWorking: true, outMessage: '' };
    }

    // Usar fuso horário do Brasil (America/Sao_Paulo)
    const now = new Date();
    const brTimeString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const brDate = new Date(brTimeString);

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
    const schedule = config.schedules.find(s => s.day === dayName);

    if (!schedule || !schedule.enabled) {
      return {
        isWorking: false,
        outMessage: config.outOfHoursMessage || 'Olá! Nosso horário de atendimento é de segunda a sexta-feira, das 08:00 às 18:00.'
      };
    }

    const currentMinutes = brDate.getHours() * 60 + brDate.getMinutes();

    const [openH, openM] = schedule.openTime.split(':').map(Number);
    const openMinutes = openH * 60 + openM;

    const [closeH, closeM] = schedule.closeTime.split(':').map(Number);
    const closeMinutes = closeH * 60 + closeM;

    if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
      return {
        isWorking: false,
        outMessage: config.outOfHoursMessage || 'Olá! Nosso horário de atendimento é de segunda a sexta-feira, das 08:00 às 18:00.'
      };
    }

    // Check lunch break
    if (schedule.hasLunchBreak && schedule.lunchStart && schedule.lunchEnd) {
      const [lStartH, lStartM] = schedule.lunchStart.split(':').map(Number);
      const lStartMinutes = lStartH * 60 + lStartM;

      const [lEndH, lEndM] = schedule.lunchEnd.split(':').map(Number);
      const lEndMinutes = lEndH * 60 + lEndM;

      if (currentMinutes >= lStartMinutes && currentMinutes <= lEndMinutes) {
        return {
          isWorking: false,
          outMessage: 'Estamos em horário de almoço no momento. Retornaremos em breve!'
        };
      }
    }

    return { isWorking: true, outMessage: '' };
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
        replyMessage: hoursCheck.outMessage
      };
    }

    // If bot is paused (human attendant engaged and not waiting), bot should not intercept
    if (!conversation.botActive && conversation.status === 'IN_PROGRESS') {
      return {};
    }

    const trimmed = incomingText.trim();

    // Check if customized flow nodes exist
    const rootNode = (flow && flow.nodes && flow.nodes.length > 0)
      ? (flow.nodes.find(n => n.type === 'START' || n.type === 'MENU' || n.id === 'node-start') || flow.nodes[0])
      : null;

    // Dynamically match user option against flow rootNode options if present
    if (rootNode && rootNode.options && rootNode.options.length > 0) {
      const matchedOpt = rootNode.options.find(o => o.triggerValue.trim() === trimmed);

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
          replyMessage: targetNode?.message || `Perfeito! Vou encaminhar você para a fila do setor **${matchedOpt.label}**. Por favor, aguarde um momento. ⏳`,
          updateConversationStatus: 'WAITING',
          targetQueueId: targetQueue?.id,
          targetQueueName: targetQueue?.name || matchedOpt.label,
          botActive: false
        };
      }
    }

    // Process fallback numerical options if flow options didn't match
    if (trimmed === '1') {
      const q = queues.find(item => item.name.toLowerCase().includes('comercial')) || queues[0];
      return {
        replyMessage: `Perfeito! Vou encaminhar você para a fila do setor **Comercial**. Por favor, aguarde um momento. ⏳`,
        updateConversationStatus: 'WAITING',
        targetQueueId: q?.id,
        targetQueueName: q?.name || 'Comercial',
        botActive: false
      };
    }

    if (trimmed === '2') {
      const q = queues.find(item => item.name.toLowerCase().includes('suporte')) || queues[0];
      return {
        replyMessage: `Certo! Vou encaminhar você para a fila de **Suporte Técnico**. Em instantes um analista assumirá seu atendimento. 🛠️`,
        updateConversationStatus: 'WAITING',
        targetQueueId: q?.id,
        targetQueueName: q?.name || 'Suporte Técnico',
        botActive: false
      };
    }

    if (trimmed === '3') {
      const q = queues.find(item => item.name.toLowerCase().includes('financeiro')) || queues[0];
      return {
        replyMessage: `Entendido! Redirecionando seu contato para o departamento **Financeiro**. 💳`,
        updateConversationStatus: 'WAITING',
        targetQueueId: q?.id,
        targetQueueName: q?.name || 'Financeiro',
        botActive: false
      };
    }

    if (trimmed === '4') {
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

    if (trimmed === '5') {
      return {
        replyMessage: `Você solicitou atendimento humano. Você foi inserido na fila de espera e o primeiro analista disponível irá te atender. 👤`,
        updateConversationStatus: 'WAITING',
        targetQueueName: 'Fila Geral',
        botActive: false
      };
    }

    // Build welcome message from rootNode message if present, or default fallback
    const welcomeMsg = rootNode?.message || `Olá! Tudo bem? 👋\n\nBem-vindo à Central de Atendimento GoDesc360.\n\nComo podemos te ajudar hoje? Digite uma opção:\n\n1 - 💼 Comercial\n2 - 🛠️ Suporte Técnico\n3 - 💳 Financeiro\n4 - 🎫 Abrir Ticket Chamado\n5 - 👤 Falar com Atendente`;

    // Default response for unhandled text -> Send menu
    return {
      replyMessage: welcomeMsg
    };
  }
}
