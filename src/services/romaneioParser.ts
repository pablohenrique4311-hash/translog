declare const window: any;

export interface ExtractedRomaneio {
  id: string;
  nomeArquivo: string;
  tamanhoBytes: number;
  numeroRomaneio: string;
  dataEmissao: string;
  motoristaNome: string;
  cpf: string;
  placa: string;
  origem: string;
  destino: string;
  pesoKg: number;
  valorCarga: number;
  descricaoCarga: string;
  textoBruto: string;
  avisos: string[];
  confianca: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export const RomaneioParser = {
  async parsePdfFile(file: File): Promise<ExtractedRomaneio> {
    let fullText = '';

    try {
      if (window.pdfjsLib) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageStrings = textContent.items.map((item: any) => item.str);
          fullText += '\n--- PÁGINA ' + i + ' ---\n' + pageStrings.join(' ');
        }
      }
    } catch (e) {
      console.warn('Falha na extração direta do PDF com PDF.js, tentando extração de texto binário:', e);
    }

    // Se o PDF.js não conseguiu extrair texto (ex: documento puramente escaneado ou erro do worker),
    // executamos decodificação heurística de fluxos de texto do PDF
    if (!fullText.trim()) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('latin1');
        const binaryText = decoder.decode(arrayBuffer);
        
        // Extrair texto entre parênteses em streams PDF: (Exemplo de texto)
        const textTokens = binaryText.match(/\(([^()]{2,100})\)\s*T[jJ]/g);
        if (textTokens && textTokens.length > 0) {
          fullText = textTokens.map(t => t.replace(/^\(/, '').replace(/\)\s*T[jJ]$/, '')).join(' ');
        } else {
          // Heurística de palavras-chave legíveis no stream
          const cleanWords = binaryText.replace(/[^\x20-\x7E\xC0-\xFF]/g, ' ').replace(/\s+/g, ' ');
          fullText = cleanWords.substring(0, 3000);
        }
      } catch (err) {
        console.error('Erro na leitura binária do arquivo:', err);
      }
    }

    // Se o nome do arquivo der pistas (ex: romaneio_8920_carlos.pdf)
    return this.parseRawText(fullText, file.name, file.size);
  },

  parseRawText(text: string, nomeArquivo: string = 'documento_romaneio.pdf', tamanhoBytes: number = 0): ExtractedRomaneio {
    const avisos: string[] = [];
    const id = 'EXT-' + Math.random().toString(36).substring(2, 9);

    // 1. Número do Romaneio / Documento
    let numeroRomaneio = '';
    const numPatterns = [
      /(?:romaneio|n[ºo°]|controle|documento|cte|minuta|manifesto)[\s:#№\.\-_]*([A-Z0-9\-_]{4,16})/i,
      /\bROM[\-_]?([0-9]{4,10})\b/i,
      /\b([0-9]{4,8})\b/
    ];

    for (const rx of numPatterns) {
      const match = text.match(rx);
      if (match && match[1]) {
        numeroRomaneio = match[1].trim();
        break;
      }
    }

    // Tentar extrair do nome do arquivo se não achar no texto
    if (!numeroRomaneio) {
      const matchFile = nomeArquivo.match(/(\d{4,8})/);
      if (matchFile) {
        numeroRomaneio = 'ROM-' + matchFile[1];
      } else {
        numeroRomaneio = 'ROM-' + Math.floor(100000 + Math.random() * 900000);
        avisos.push('Número de romaneio não identificado com exatidão; código provisório sugerido.');
      }
    }

    // 2. Data de Emissão
    let dataEmissao = new Date().toISOString().substring(0, 10);
    const dateMatch = text.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
    if (dateMatch) {
      const [_, dia, mes, ano] = dateMatch;
      const numDia = parseInt(dia, 10);
      const numMes = parseInt(mes, 10);
      const numAno = parseInt(ano, 10);
      if (numDia >= 1 && numDia <= 31 && numMes >= 1 && numMes <= 12 && numAno >= 2020 && numAno <= 2030) {
        dataEmissao = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
    } else {
      avisos.push('Data de emissão não localizada no documento; assumida a data de hoje.');
    }

    // 3. CPF do Motorista
    let cpf = '';
    const cpfMatch = text.match(/(\d{3}\.?\d{3}\.?\d{3}\-?\d{2})/);
    if (cpfMatch) {
      const digits = cpfMatch[1].replace(/\D/g, '');
      if (digits.length === 11) {
        cpf = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
    }

    // 4. Placa do Veículo (Padrão Mercosul BRA2E19 ou Antigo ABC-1234)
    let placa = '';
    const placaMatch = text.match(/\b([A-Z]{3}[-]?[0-9][A-Z0-9][0-9]{2})\b/i);
    if (placaMatch) {
      placa = placaMatch[1].toUpperCase().replace('-', '');
    } else {
      avisos.push('Placa do veículo não detectada automaticamente.');
    }

    // 5. Nome do Motorista / Condutor
    let motoristaNome = '';
    const nomePatterns = [
      /(?:motorista|condutor|transportador|nome)[\s:]+([A-ZÀ-Úa-zà-ú\s]{5,40})(?:\s*[-|,|\n|CPF|RG])/i,
      /(?:motorista|condutor)[\s:]+([A-ZÀ-Úa-zà-ú\s]{5,40})/i
    ];
    for (const rx of nomePatterns) {
      const match = text.match(rx);
      if (match && match[1]) {
        const candidate = match[1].trim().replace(/\s+/g, ' ');
        if (!/(cpf|placa|data|valor|origem|destino|peso)/i.test(candidate)) {
          motoristaNome = candidate;
          break;
        }
      }
    }

    // 6. Origem e Destino
    let origem = '';
    let destino = '';
    const rotaMatch = text.match(/origem[\s:]+([^-,;\n\r]{3,40})[\s\S]*?destino[\s:]+([^-,;\n\r]{3,40})/i);
    if (rotaMatch) {
      origem = rotaMatch[1].trim();
      destino = rotaMatch[2].trim();
    } else {
      const cidadeMatch = text.match(/(?:origem|de)[\s:]+([A-Za-zÀ-ú\s]{3,25}\/[A-Z]{2})/i);
      if (cidadeMatch) origem = cidadeMatch[1].trim();
      
      const destinoMatch = text.match(/(?:destino|para)[\s:]+([A-Za-zÀ-ú\s]{3,25}\/[A-Z]{2})/i);
      if (destinoMatch) destino = destinoMatch[1].trim();
    }

    if (!origem) origem = 'Centro de Distribuição Principal';
    if (!destino) destino = 'Entrega Operacional';

    // 7. Peso em KG
    let pesoKg = 0;
    const pesoMatch = text.match(/(\d{1,3}(?:\.\d{3})*|\d+)(?:,\d+)?\s*(?:kg|quilos|kgs)/i);
    if (pesoMatch) {
      const raw = pesoMatch[1].replace(/\./g, '');
      pesoKg = parseFloat(raw) || 0;
    }

    // 8. Valor da Carga (R$)
    let valorCarga = 0;
    const valorMatch = text.match(/R\$\s*([\d\.,]+)/i);
    if (valorMatch) {
      const cleaned = valorMatch[1].replace(/\./g, '').replace(',', '.');
      valorCarga = parseFloat(cleaned) || 0;
    }

    // 9. Descrição dos Produtos
    let descricaoCarga = 'Mercadorias Gerais em Carga Fechada / Paletizada';
    const descMatch = text.match(/(?:mercadoria|produto|carga|conteudo)[\s:]+([A-Za-zÀ-ú0-9\s,\-]{5,60})/i);
    if (descMatch) {
      descricaoCarga = descMatch[1].trim();
    }

    const confianca: 'ALTA' | 'MEDIA' | 'BAIXA' = (numeroRomaneio && (cpf || placa)) ? 'ALTA' : (numeroRomaneio ? 'MEDIA' : 'BAIXA');

    return {
      id,
      nomeArquivo,
      tamanhoBytes,
      numeroRomaneio,
      dataEmissao,
      motoristaNome,
      cpf,
      placa,
      origem,
      destino,
      pesoKg,
      valorCarga,
      descricaoCarga,
      textoBruto: text.substring(0, 3000),
      avisos,
      confianca
    };
  }
};
