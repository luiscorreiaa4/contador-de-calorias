# 01 — Inteligência Artificial: conceitos base

> Itens desta seção: **RAG**, **Fine-tuning**, **AI slop** (conceito), **Humanizer** (contexto), **GEO** e **llms.txt** (resumo — detalhes em `07-seo-geo-presenca-online.md`).

---

## RAG (Retrieval-Augmented Generation)

**O que é:** técnica em que, antes de o modelo responder, o sistema *busca* trechos relevantes numa base de conhecimento (seus PDFs, docs, banco de dados, site) e coloca esses trechos no prompt. O modelo responde "lendo" o material na hora, em vez de depender só do que aprendeu no treino.

**Como funciona (pipeline típico):**
1. **Ingestão** — você quebra os documentos em pedaços (*chunks*) de ~300–1000 tokens.
2. **Embeddings** — cada pedaço vira um vetor numérico (ex.: OpenAI `text-embedding-3`, Voyage, Cohere, modelos open-source).
3. **Vector store** — os vetores ficam num banco vetorial: **pgvector (Postgres/Supabase)**, Pinecone, Qdrant, Weaviate, Chroma.
4. **Busca** — a pergunta do usuário também vira vetor; você busca os *k* pedaços mais parecidos (às vezes combinando com busca por palavra-chave = *hybrid search*) e opcionalmente faz *re-ranking*.
5. **Geração** — envia pergunta + trechos para o LLM, pedindo para citar as fontes.

**Quando usar:** chatbot de atendimento que conhece seus produtos, busca em documentação interna, assistente jurídico sobre seus contratos. Use quando a informação **muda com frequência** ou é **privada**.

**Cuidados:**
- Qualidade do chunking e dos metadados importa mais que o modelo.
- Documentos recuperados podem conter **prompt injection** (texto malicioso que tenta dar ordens ao modelo) — trate-os como dados, não instruções. Ver `03-seguranca-web.md`.
- Respeite permissões: o usuário A não pode recuperar documentos do usuário B (aplique RLS/filtro por `tenant_id` também na busca vetorial).

**Links:**
- Supabase + pgvector: https://supabase.com/docs/guides/ai
- LangChain RAG tutorial: https://python.langchain.com/docs/tutorials/rag/
- LlamaIndex: https://docs.llamaindex.ai/
- Anthropic — Contextual Retrieval: https://www.anthropic.com/news/contextual-retrieval

---

## Fine-tuning (ajuste fino)

**O que é:** continuar o treinamento de um modelo já pronto com **seus exemplos** (pares de entrada → saída desejada), alterando os pesos do modelo para que ele adote um estilo, formato ou comportamento específico.

**RAG × Fine-tuning — regra prática:**

| Você quer… | Use |
|---|---|
| Que o modelo **saiba fatos** novos ou que mudam (preços, catálogo, docs) | **RAG** |
| Que o modelo **se comporte** de um jeito fixo (tom de voz, formato JSON rígido, classificação) | **Fine-tuning** |
| Algo rápido e barato para começar | **Prompt bem escrito + exemplos (few-shot)** — tente isso primeiro |

**Variações:** fine-tuning completo; **LoRA / QLoRA** (treina só "adaptadores" pequenos — muito mais barato, popular em modelos open-source); *distillation* (um modelo grande ensina um pequeno).

**Cuidados:** precisa de centenas a milhares de exemplos bons; dados pessoais no dataset entram no modelo (atenção à LGPD); a cada nova versão do modelo base pode ser preciso refazer.

**Links:**
- Hugging Face — PEFT/LoRA: https://huggingface.co/docs/peft
- Unsloth (fine-tuning rápido de modelos open): https://github.com/unslothai/unsloth
- OpenAI fine-tuning guide: https://platform.openai.com/docs/guides/fine-tuning

---

## AI slop ("lixo de IA")

**O que é:** termo para conteúdo gerado por IA em massa, genérico e sem cuidado — texto, imagem ou interface. Em sites, os sinais clássicos são:

- **Visual:** gradiente roxo→azul em tudo, fonte Inter em todo lugar, cards idênticos com ícone + título + 2 linhas, emojis decorando títulos, "glassmorphism" sem motivo, hero com "Revolutionize your workflow".
- **Texto:** "Em um mundo cada vez mais…", "não é apenas X, é Y", listas de três adjetivos, travessões em excesso, "mergulhar", "jornada", "desbloquear seu potencial".
- **Produto:** features que ninguém pediu, depoimentos inventados, fotos de banco de imagem genéricas.

**Por que importa:** usuários já reconhecem esse padrão e associam a pouco cuidado → menos confiança e conversão.

**Como evitar:**
- Partir de **referências reais** (Refero, Inspora — ver `06-design-ui-ux.md`) em vez do "gosto médio" do modelo.
- Skills que forçam escolhas intencionais: `frontend-design`, `refero-design`, `ui-ux-pro-max` (ver `02-claude-code-skills-plugins-mcps.md`).
- Para texto: skill **Humanizer** (abaixo) + revisão humana.
- Fotos reais da empresa/equipe/produto (ver `06`).

---

## Humanizer (contexto)

Skill de Claude Code que reescreve textos removendo os padrões típicos de escrita de IA, baseada no guia "Signs of AI writing" mantido pela comunidade da Wikipédia. Detalhes e instalação em `02-claude-code-skills-plugins-mcps.md`.

> ⚠️ Use para melhorar a qualidade do texto, não para enganar (ex.: esconder que um texto acadêmico foi feito por IA quando isso é proibido).

---

## GEO e llms.txt (resumo)

- **GEO (Generative Engine Optimization):** otimizar seu site para ser **citado por IAs** (ChatGPT, Perplexity, Gemini, AI Overviews do Google), não só para aparecer nos links azuis.
- **llms.txt:** arquivo na raiz do site (`/llms.txt`) em Markdown que resume o site e lista as páginas mais importantes para modelos de IA lerem.

➡️ Explicação completa em `07-seo-geo-presenca-online.md`.
