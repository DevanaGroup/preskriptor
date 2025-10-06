# Configuração Google Document AI - OCR Rápido

## Benefícios
- **Velocidade**: 2-5 segundos vs 30-60 segundos atual
- **Custo**: 1.000 páginas gratuitas/mês, depois ~$1.50/1000 páginas
- **Precisão**: 95%+ para documentos médicos

## Passos de Configuração

### 1. Ativar Google Document AI
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione projeto `preskriptor-e8a69`
3. Vá em "APIs & Services" > "Library"
4. Procure "Document AI API"
5. Clique "Enable"

### 2. Criar Processor
1. Vá em "Document AI" no menu lateral
2. Clique "Create Processor"
3. Selecione "Document OCR"
4. Nome: "Preskriptor OCR"
5. Região: "us-central1"
6. Clique "Create"
7. **Copie o Processor ID** (formato: abc123def456)

### 3. Configurar Variáveis de Ambiente
Adicione no arquivo `.env`:
```
DOCUMENT_AI_PROCESSOR_ID=seu_processor_id_aqui
GOOGLE_PROJECT_ID=preskriptor-e8a69
```

### 4. Autenticação
O sistema já usa as credenciais do Firebase, que servem para Document AI também.

## Teste
Após configurar, faça upload de um PDF. Você verá nos logs:
```
🚀 Tentando Google Document AI para: arquivo.pdf
✅ Document AI processou em segundos!
```

## Fallback
Se Document AI falhar, o sistema automaticamente usa o método atual (OpenAI Vision).

## Custo Estimado
- Clínica pequena (100 docs/mês): Gratuito
- Clínica média (500 docs/mês): ~$5/mês
- Clínica grande (2000 docs/mês): ~$15/mês