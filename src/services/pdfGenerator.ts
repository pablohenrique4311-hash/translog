import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AcertoMotorista, Viagem, ConfiguracaoEmpresa, Motorista, Veiculo } from '../types';

export const PdfGenerator = {
  // 1. Demonstrativo Oficial de Acerto de Motoristas (Memória de cálculo, abatimentos e saldo líquido)
  gerarDemonstrativoAcerto(
    acerto: AcertoMotorista,
    viagens: Viagem[],
    motorista: Motorista,
    empresa: ConfiguracaoEmpresa
  ) {
    const doc = new jsPDF();

    // Top Header Banner (Azul Marinho TransLog #0A192F)
    doc.setFillColor(10, 25, 47);
    doc.rect(0, 0, 210, 36, 'F');

    // Accent line (Verde Esmeralda #10B981)
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 36, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(empresa.nomeFantasia.toUpperCase(), 14, 15);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${empresa.razaoSocial} | CNPJ: ${empresa.cnpj} | IE: ${empresa.inscricaoEstadual}`, 14, 22);
    doc.text(`${empresa.enderecoCompleto}`, 14, 27);
    doc.text(`Tel: ${empresa.telefone} | E-mail: ${empresa.email}`, 14, 32);

    // Título do Demonstrativo
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`DEMONSTRATIVO DE ACERTO DE FRETES - ${acerto.codigoAcerto}`, 14, 48);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 53);

    // Bloco de Identificação do Motorista
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 56, 182, 30, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 56, 182, 30, 2, 2, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('DADOS DO MOTORISTA E CONTA DE LIQUIDAÇÃO:', 18, 63);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Nome: ${motorista.nomeCompleto}`, 18, 70);
    doc.text(`CPF: ${motorista.cpf} | Vínculo: ${motorista.tipoVinculo} | CNH: ${motorista.cnh} (${motorista.categoriaCnh})`, 18, 76);
    doc.text(`Chave Pix (${motorista.tipoChavePix}): ${motorista.chavePix || 'Não cadastrada'}`, 18, 82);
    doc.text(`Dados Bancários: ${motorista.banco} | Ag: ${motorista.agencia} | CC: ${motorista.conta}`, 115, 82);

    // Tabela das Viagens Concluídas
    const tableData = viagens.map(v => [
      v.codigoViagem,
      v.numeroRomaneio,
      new Date(v.dataSaida).toLocaleDateString('pt-BR'),
      `${v.origem} -> ${v.destino}`,
      v.veiculoPlaca,
      `R$ ${v.valorFreteBruto.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 91,
      head: [['Viagem', 'Romaneio', 'Data', 'Trajeto', 'Placa', 'Frete Bruto']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        5: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 6;

    // Bloco de Memória de Cálculo Auditável
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, finalY, 182, 48, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, finalY, 182, 48, 2, 2, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('MEMÓRIA DE CÁLCULO E TOTALIZAÇÃO (AUDITÁVEL):', 18, finalY + 8);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    doc.text(`(+) Total Bruto dos Fretes (${acerto.totalViagens} viagens apuradas):`, 18, finalY + 16);
    doc.text(`R$ ${acerto.valorTotalFretes.toFixed(2)}`, 190, finalY + 16, { align: 'right' });

    doc.text(`(+) Despesas Reembolsáveis Comprovadas:`, 18, finalY + 23);
    doc.text(`R$ ${acerto.totalDespesasReembolsaveis.toFixed(2)}`, 190, finalY + 23, { align: 'right' });

    doc.text(`(-) Adiantamentos de Viagem e Vales Descontados:`, 18, finalY + 30);
    doc.text(`- R$ ${acerto.totalAdiantamentos.toFixed(2)}`, 190, finalY + 30, { align: 'right' });

    doc.text(`(-) Outros Descontos Autorizados:`, 18, finalY + 37);
    doc.text(`- R$ ${acerto.totalDescontos.toFixed(2)}`, 190, finalY + 37, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105); // Verde esmeralda
    doc.text(`(=) SALDO LÍQUIDO A PAGAR AO MOTORISTA:`, 18, finalY + 45);
    doc.text(`R$ ${acerto.saldoLiquidoPagar.toFixed(2)}`, 190, finalY + 45, { align: 'right' });

    // Termo de Quitação e Assinaturas
    const signY = finalY + 68;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Declaro para os devidos fins que conferi os fretes acima descritos e recebi o valor líquido indicado, dando plena e rasa quitação das viagens elencadas.',
      14,
      signY - 10
    );

    doc.line(20, signY + 12, 90, signY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(motorista.nomeCompleto, 20, signY + 17);
    doc.text(`CPF: ${motorista.cpf}`, 20, signY + 22);

    doc.line(120, signY + 12, 190, signY + 12);
    doc.text(empresa.nomeFantasia, 120, signY + 17);
    doc.text(`Depto Financeiro & Controladoria`, 120, signY + 22);

    doc.save(`Acerto_${acerto.codigoAcerto}_${motorista.nomeCompleto.replace(/\s+/g, '_')}.pdf`);
  },

  // 2. Ordem de Coleta / Documento de Viagem Oficial
  gerarOrdemViagem(viagem: Viagem, empresa: ConfiguracaoEmpresa, motorista?: Motorista, veiculo?: Veiculo) {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(10, 25, 47);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 32, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(empresa.nomeFantasia.toUpperCase(), 14, 14);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`ORDEM DE CARREGAMENTO E TRANSPORTE • ${viagem.codigoViagem}`, 14, 22);
    doc.text(`CNPJ: ${empresa.cnpj} | Central: ${empresa.telefone}`, 14, 28);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`DADOS DA VIAGEM E CONDUTOR`, 14, 44);

    const info = [
      ['Código Viagem:', viagem.codigoViagem, 'Nº Romaneio:', viagem.numeroRomaneio],
      ['Cliente Embarcador:', viagem.clienteNome, 'Status Operacional:', viagem.status],
      ['Motorista:', viagem.motoristaNome, 'CPF:', motorista?.cpf || '-'],
      ['Veículo / Placa:', viagem.veiculoPlaca, 'Modelo:', veiculo?.modelo || 'Cavalo Mecânico'],
      ['Origem:', viagem.origem, 'Destino:', viagem.destino],
      ['Data de Saída:', new Date(viagem.dataSaida).toLocaleDateString('pt-BR'), 'Chegada Prevista:', new Date(viagem.dataChegadaPrevista).toLocaleDateString('pt-BR')],
      ['Valor do Frete:', `R$ ${viagem.valorFreteBruto.toFixed(2)}`, 'Pedágio Incluso:', `R$ ${viagem.pedagioIncluso.toFixed(2)}`]
    ];

    autoTable(doc, {
      startY: 48,
      body: info,
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [30, 58, 138], cellWidth: 35 },
        1: { cellWidth: 65 },
        2: { fontStyle: 'bold', textColor: [30, 58, 138], cellWidth: 35 },
        3: { cellWidth: 55 }
      }
    });

    // @ts-ignore
    const currentY = doc.lastAutoTable.finalY + 12;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, 182, 35, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, 182, 35, 2, 2, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('INSTRUÇÕES OPERACIONAIS AO CONDUTOR:', 18, currentY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('1. Manter conferência das notas fiscais e integridade das travas e lacres da carga.', 18, currentY + 15);
    doc.text('2. Respeitar limites legais de jornada de trabalho (Lei 13.103/2015) e paradas obrigatórias.', 18, currentY + 21);
    doc.text('3. Em caso de sinistro, avaria ou atraso na rota, acionar imediatamente a central da transportadora.', 18, currentY + 27);

    // Assinaturas
    const endY = currentY + 60;
    doc.line(20, endY, 90, endY);
    doc.setFontSize(8);
    doc.text('Assinatura do Motorista', 30, endY + 5);

    doc.line(120, endY, 190, endY);
    doc.text('Visto de Liberação da Portaria', 130, endY + 5);

    doc.save(`Ordem_Viagem_${viagem.codigoViagem}.pdf`);
  }
};
