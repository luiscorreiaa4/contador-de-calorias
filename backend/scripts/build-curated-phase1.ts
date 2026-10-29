import fs from 'fs';
import path from 'path';

interface TacoItem {
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  base_unit: string;
  serving_weight: number;
  source: string;
  external_id: string;
}

interface MappingItem {
  canonicalName: string;
  tacoId: string;
  unitName: string;
  unitWeight: number;
  baseUnit?: 'g' | 'ml';
}

interface CuratedOutputFood {
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  base_unit: 'g' | 'ml';
  serving_weight: number;
  unit_name: string;
  unit_weight: number;
  source: string;
  source_ref: string;
  external_id: string;
}

// Mapeamento Curado - Fase 1 (Alimentos do Dia a Dia)
// Baseado no documento docs/plano-base-alimentos.md e Medidas Referidas IBGE POF
const PHASE_1_MAPPINGS: MappingItem[] = [
  // 1. CEREAIS, GRÃOS E MASSAS
  { canonicalName: 'Arroz branco cozido', tacoId: 'TACO-3', unitName: 'colher de sopa cheia', unitWeight: 25 },
  { canonicalName: 'Arroz integral cozido', tacoId: 'TACO-1', unitName: 'colher de sopa cheia', unitWeight: 25 },
  { canonicalName: 'Arroz branco cru', tacoId: 'TACO-4', unitName: 'xícara de chá', unitWeight: 180 },
  { canonicalName: 'Arroz integral cru', tacoId: 'TACO-2', unitName: 'xícara de chá', unitWeight: 180 },
  { canonicalName: 'Macarrão de trigo cru (espaguete, parafuso)', tacoId: 'TACO-40', unitName: 'porção individual', unitWeight: 80 },
  { canonicalName: 'Macarrão com ovos cru', tacoId: 'TACO-41', unitName: 'porção individual', unitWeight: 80 },
  { canonicalName: 'Macarrão instantâneo cru (miojo)', tacoId: 'TACO-39', unitName: 'pacote individual', unitWeight: 85 },
  { canonicalName: 'Aveia em flocos crua', tacoId: 'TACO-7', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Cuscuz de milho cozido (flocão)', tacoId: 'TACO-533', unitName: 'fatia / porção média', unitWeight: 100 },
  { canonicalName: 'Farinha de mandioca torrada', tacoId: 'TACO-122', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Farinha de mandioca crua', tacoId: 'TACO-121', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Farofa pronta temperada', tacoId: 'TACO-131', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Polvilho / fécula de mandioca (base para tapioca)', tacoId: 'TACO-124', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Pipoca tradicional (com óleo vegetal e sal)', tacoId: 'TACO-61', unitName: 'xícara', unitWeight: 15 },

  // 2. LEGUMINOSAS
  { canonicalName: 'Feijão carioca cozido', tacoId: 'TACO-561', unitName: 'concha média', unitWeight: 130 },
  { canonicalName: 'Feijão carioca cru', tacoId: 'TACO-562', unitName: 'concha média', unitWeight: 100 },
  { canonicalName: 'Feijão preto cozido', tacoId: 'TACO-567', unitName: 'concha média', unitWeight: 130 },
  { canonicalName: 'Feijão fradinho cozido (feijão-de-corda)', tacoId: 'TACO-563', unitName: 'concha média', unitWeight: 130 },
  { canonicalName: 'Lentilha cozida', tacoId: 'TACO-577', unitName: 'concha média', unitWeight: 130 },
  { canonicalName: 'Grão-de-bico cru', tacoId: 'TACO-575', unitName: 'concha média', unitWeight: 100 },
  { canonicalName: 'Ervilha em conserva drenada', tacoId: 'TACO-560', unitName: 'colher de sopa cheia', unitWeight: 20 },

  // 3. PÃES E SIMILARES
  { canonicalName: 'Pão francês (pão de sal, cacetinho)', tacoId: 'TACO-53', unitName: 'unidade', unitWeight: 50 },
  { canonicalName: 'Pão de forma integral', tacoId: 'TACO-52', unitName: 'fatia', unitWeight: 25 },
  { canonicalName: 'Pão de queijo assado', tacoId: 'TACO-140', unitName: 'unidade média', unitWeight: 40 },
  { canonicalName: 'Torrada de pão francês', tacoId: 'TACO-63', unitName: 'unidade', unitWeight: 10 },
  { canonicalName: 'Biscoito cream cracker (água e sal)', tacoId: 'TACO-13', unitName: 'unidade', unitWeight: 6 },
  { canonicalName: 'Biscoito doce de maisena', tacoId: 'TACO-8', unitName: 'unidade', unitWeight: 5 },
  { canonicalName: 'Biscoito recheado de chocolate', tacoId: 'TACO-9', unitName: 'unidade', unitWeight: 12 },
  { canonicalName: 'Biscoito recheado de morango', tacoId: 'TACO-10', unitName: 'unidade', unitWeight: 12 },

  // 4. CARNES, AVES, PEIXES E OVOS
  { canonicalName: 'Frango, peito grelhado (sem pele)', tacoId: 'TACO-410', unitName: 'filé médio', unitWeight: 100 },
  { canonicalName: 'Frango, peito cozido (sem pele)', tacoId: 'TACO-408', unitName: 'filé médio', unitWeight: 100 },
  { canonicalName: 'Frango, peito cru (sem pele)', tacoId: 'TACO-409', unitName: 'filé médio', unitWeight: 100 },
  { canonicalName: 'Frango, coxa assada (com pele)', tacoId: 'TACO-396', unitName: 'unidade média', unitWeight: 75 },
  { canonicalName: 'Frango, coxa cozida (sem pele)', tacoId: 'TACO-398', unitName: 'unidade média', unitWeight: 65 },
  { canonicalName: 'Frango, sobrecoxa assada (sem pele)', tacoId: 'TACO-413', unitName: 'unidade média', unitWeight: 80 },
  { canonicalName: 'Frango, coração grelhado', tacoId: 'TACO-395', unitName: 'unidade', unitWeight: 15 },
  { canonicalName: 'Linguiça de frango grelhada', tacoId: 'TACO-420', unitName: 'gomo médio', unitWeight: 50 },
  { canonicalName: 'Carne bovina moída refogada (acém moído cozido)', tacoId: 'TACO-326', unitName: 'colher de sopa cheia', unitWeight: 30 },
  { canonicalName: 'Carne bovina, bife de alcatra grelhado (sem gordura)', tacoId: 'TACO-370', unitName: 'bife médio', unitWeight: 100 },
  { canonicalName: 'Carne bovina, bife de patinho grelhado (sem gordura)', tacoId: 'TACO-377', unitName: 'bife médio', unitWeight: 100 },
  { canonicalName: 'Carne bovina, bife de contrafilé grelhado (sem gordura)', tacoId: 'TACO-337', unitName: 'bife médio', unitWeight: 100 },
  { canonicalName: 'Carne bovina de panela (acém cozido em cubos)', tacoId: 'TACO-328', unitName: 'pedaço médio', unitWeight: 50 },
  { canonicalName: 'Carne seca cozida (charque, carne de sol)', tacoId: 'TACO-338', unitName: 'porção média', unitWeight: 80 },
  { canonicalName: 'Carne suína, lombo assado', tacoId: 'TACO-432', unitName: 'fatia / bife médio', unitWeight: 80 },
  { canonicalName: 'Peixe, pescada branca filé frito', tacoId: 'TACO-308', unitName: 'filé médio', unitWeight: 100 },
  { canonicalName: 'Peixe, pescada branca crua', tacoId: 'TACO-304', unitName: 'filé médio', unitWeight: 100 },
  { canonicalName: 'Sardinha assada', tacoId: 'TACO-318', unitName: 'unidade média', unitWeight: 35 },
  { canonicalName: 'Sardinha em lata em óleo', tacoId: 'TACO-319', unitName: 'unidade', unitWeight: 30 },
  { canonicalName: 'Atum em lata em óleo', tacoId: 'TACO-277', unitName: 'colher de sopa', unitWeight: 20 },
  { canonicalName: 'Camarão cozido', tacoId: 'TACO-284', unitName: 'unidade média', unitWeight: 10 },
  { canonicalName: 'Ovo de galinha cozido', tacoId: 'TACO-488', unitName: 'unidade média', unitWeight: 50 },
  { canonicalName: 'Ovo de galinha frito', tacoId: 'TACO-490', unitName: 'unidade média', unitWeight: 50 },
  { canonicalName: 'Ovo de galinha, clara cozida', tacoId: 'TACO-486', unitName: 'unidade', unitWeight: 35 },
  { canonicalName: 'Omelete de queijo', tacoId: 'TACO-484', unitName: 'porção média', unitWeight: 100 },

  // 5. LEITE E DERIVADOS
  { canonicalName: 'Leite de vaca integral', tacoId: 'TACO-458', unitName: 'copo americano', unitWeight: 200, baseUnit: 'ml' },
  { canonicalName: 'Leite de vaca desnatado UHT', tacoId: 'TACO-457', unitName: 'copo americano', unitWeight: 200, baseUnit: 'ml' },
  { canonicalName: 'Leite em pó integral', tacoId: 'TACO-459', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Leite em pó desnatado', tacoId: 'TACO-456', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Leite condensado tradicional', tacoId: 'TACO-453', unitName: 'colher de sopa', unitWeight: 20 },
  { canonicalName: 'Creme de leite tradicional', tacoId: 'TACO-447', unitName: 'colher de sopa', unitWeight: 15 },
  { canonicalName: 'Iogurte natural integral', tacoId: 'TACO-448', unitName: 'pote individual', unitWeight: 170 },
  { canonicalName: 'Iogurte natural desnatado', tacoId: 'TACO-449', unitName: 'pote individual', unitWeight: 170 },
  { canonicalName: 'Queijo muçarela (mozarela)', tacoId: 'TACO-463', unitName: 'fatia', unitWeight: 30 },
  { canonicalName: 'Queijo minas frescal', tacoId: 'TACO-461', unitName: 'fatia média', unitWeight: 30 },
  { canonicalName: 'Queijo parmesão ralado', tacoId: 'TACO-464', unitName: 'colher de sopa', unitWeight: 10 },
  { canonicalName: 'Queijo prato', tacoId: 'TACO-467', unitName: 'fatia', unitWeight: 30 },
  { canonicalName: 'Queijo ricota fresca', tacoId: 'TACO-469', unitName: 'fatia média', unitWeight: 30 },
  { canonicalName: 'Manteiga com sal', tacoId: 'TACO-261', unitName: 'colher de chá', unitWeight: 10 },
  { canonicalName: 'Margarina vegetal com sal', tacoId: 'TACO-263', unitName: 'colher de chá', unitWeight: 10 },

  // 6. TUBÉRCULOS E RAÍZES
  { canonicalName: 'Batata inglesa cozida', tacoId: 'TACO-91', unitName: 'unidade média', unitWeight: 140 },
  { canonicalName: 'Batata inglesa frita', tacoId: 'TACO-93', unitName: 'escumadeira / porção média', unitWeight: 100 },
  { canonicalName: 'Batata doce cozida', tacoId: 'TACO-88', unitName: 'unidade média', unitWeight: 150 },
  { canonicalName: 'Batata baroa cozida (mandioquinha)', tacoId: 'TACO-86', unitName: 'unidade média', unitWeight: 100 },
  { canonicalName: 'Mandioca cozida (aipim, macaxeira)', tacoId: 'TACO-129', unitName: 'pedaço médio', unitWeight: 100 },
  { canonicalName: 'Mandioca frita', tacoId: 'TACO-132', unitName: 'pedaço médio', unitWeight: 50 },
  { canonicalName: 'Inhame cru', tacoId: 'TACO-126', unitName: 'unidade média', unitWeight: 150 },
  { canonicalName: 'Cará cozido', tacoId: 'TACO-102', unitName: 'pedaço médio', unitWeight: 100 },

  // 7. FRUTAS
  { canonicalName: 'Banana prata crua', tacoId: 'TACO-179', unitName: 'unidade média', unitWeight: 65 },
  { canonicalName: 'Banana nanica crua', tacoId: 'TACO-178', unitName: 'unidade média', unitWeight: 85 },
  { canonicalName: 'Banana da terra crua', tacoId: 'TACO-175', unitName: 'unidade média', unitWeight: 120 },
  { canonicalName: 'Maçã fuji com casca crua', tacoId: 'TACO-221', unitName: 'unidade média', unitWeight: 130 },
  { canonicalName: 'Maçã gala com casca crua', tacoId: 'TACO-222', unitName: 'unidade média', unitWeight: 130 },
  { canonicalName: 'Laranja pera crua', tacoId: 'TACO-214', unitName: 'unidade média', unitWeight: 150 },
  { canonicalName: 'Laranja pera suco natural', tacoId: 'TACO-215', unitName: 'copo americano', unitWeight: 200, baseUnit: 'ml' },
  { canonicalName: 'Mamão formosa cru', tacoId: 'TACO-225', unitName: 'fatia média', unitWeight: 150 },
  { canonicalName: 'Mamão papaia cru', tacoId: 'TACO-226', unitName: 'metade', unitWeight: 140 },
  { canonicalName: 'Manga palmer crua', tacoId: 'TACO-229', unitName: 'fatia / metade média', unitWeight: 100 },
  { canonicalName: 'Melancia crua', tacoId: 'TACO-235', unitName: 'fatia média', unitWeight: 200 },
  { canonicalName: 'Melão cru', tacoId: 'TACO-236', unitName: 'fatia média', unitWeight: 150 },
  { canonicalName: 'Abacaxi cru', tacoId: 'TACO-164', unitName: 'fatia média', unitWeight: 80 },
  { canonicalName: 'Uva Itália crua', tacoId: 'TACO-256', unitName: 'cacho pequeno', unitWeight: 100 },
  { canonicalName: 'Uva Rubi crua', tacoId: 'TACO-257', unitName: 'cacho pequeno', unitWeight: 100 },
  { canonicalName: 'Morango cru', tacoId: 'TACO-239', unitName: 'unidade média', unitWeight: 15 },
  { canonicalName: 'Abacate cru', tacoId: 'TACO-163', unitName: 'colher de sopa cheia', unitWeight: 45 },
  { canonicalName: 'Goiaba vermelha com casca crua', tacoId: 'TACO-200', unitName: 'unidade média', unitWeight: 130 },
  { canonicalName: 'Goiaba branca com casca crua', tacoId: 'TACO-197', unitName: 'unidade média', unitWeight: 130 },
  { canonicalName: 'Acerola crua', tacoId: 'TACO-169', unitName: 'unidade', unitWeight: 10 },
  { canonicalName: 'Caju cru', tacoId: 'TACO-186', unitName: 'unidade média', unitWeight: 100 },
  { canonicalName: 'Maracujá polpa crua', tacoId: 'TACO-232', unitName: 'colher de sopa', unitWeight: 30 },
  { canonicalName: 'Limão tahiti cru', tacoId: 'TACO-220', unitName: 'unidade média', unitWeight: 50 },
  { canonicalName: 'Água de coco verde', tacoId: 'TACO-478', unitName: 'copo americano', unitWeight: 200, baseUnit: 'ml' },

  // 8. VERDURAS E LEGUMES
  { canonicalName: 'Alface crespa crua', tacoId: 'TACO-78', unitName: 'folha média', unitWeight: 15 },
  { canonicalName: 'Alface americana crua', tacoId: 'TACO-77', unitName: 'folha média', unitWeight: 20 },
  { canonicalName: 'Tomate com semente cru', tacoId: 'TACO-157', unitName: 'unidade média', unitWeight: 100 },
  { canonicalName: 'Tomate extrato concentrado', tacoId: 'TACO-158', unitName: 'colher de sopa', unitWeight: 20 },
  { canonicalName: 'Tomate molho pronto industrializado', tacoId: 'TACO-159', unitName: 'colher de sopa', unitWeight: 25 },
  { canonicalName: 'Cebola crua', tacoId: 'TACO-107', unitName: 'unidade média', unitWeight: 80 },
  { canonicalName: 'Cenoura crua', tacoId: 'TACO-110', unitName: 'unidade média', unitWeight: 100 },
  { canonicalName: 'Cenoura cozida', tacoId: 'TACO-109', unitName: 'colher de sopa picada', unitWeight: 25 },
  { canonicalName: 'Pepino cru com casca', tacoId: 'TACO-142', unitName: 'fatia média', unitWeight: 15 },
  { canonicalName: 'Brócolis cozido', tacoId: 'TACO-100', unitName: 'ramalhete médio', unitWeight: 40 },
  { canonicalName: 'Couve manteiga refogada', tacoId: 'TACO-116', unitName: 'colher de sopa cheia', unitWeight: 20 },
  { canonicalName: 'Couve manteiga crua', tacoId: 'TACO-115', unitName: 'folha média', unitWeight: 20 },
  { canonicalName: 'Abobrinha italiana cozida', tacoId: 'TACO-70', unitName: 'colher de sopa cheia', unitWeight: 25 },
  { canonicalName: 'Abobrinha italiana refogada', tacoId: 'TACO-72', unitName: 'colher de sopa cheia', unitWeight: 25 },
  { canonicalName: 'Abóbora cabotiá cozida (jerimum)', tacoId: 'TACO-64', unitName: 'fatia / pedaço médio', unitWeight: 100 },
  { canonicalName: 'Chuchu cozido', tacoId: 'TACO-112', unitName: 'colher de sopa cheia', unitWeight: 30 },
  { canonicalName: 'Beterraba cozida', tacoId: 'TACO-97', unitName: 'fatia média', unitWeight: 20 },
  { canonicalName: 'Beterraba crua ralada', tacoId: 'TACO-98', unitName: 'colher de sopa cheia', unitWeight: 20 },
  { canonicalName: 'Repolho branco cru', tacoId: 'TACO-149', unitName: 'pires de chá picado', unitWeight: 50 },
  { canonicalName: 'Repolho roxo cru', tacoId: 'TACO-150', unitName: 'pires de chá picado', unitWeight: 50 },
  { canonicalName: 'Quiabo cru', tacoId: 'TACO-147', unitName: 'unidade média', unitWeight: 15 },
  { canonicalName: 'Palmito em conserva', tacoId: 'TACO-138', unitName: 'tolete médio', unitWeight: 50 },

  // 9. GORDURAS, AÇÚCARES E CONDIMENTOS
  { canonicalName: 'Azeite de oliva extra virgem', tacoId: 'TACO-260', unitName: 'colher de sopa', unitWeight: 13 },
  { canonicalName: 'Óleo de soja vegetal', tacoId: 'TACO-272', unitName: 'colher de sopa', unitWeight: 13 },
  { canonicalName: 'Óleo de milho', tacoId: 'TACO-270', unitName: 'colher de sopa', unitWeight: 13 },
  { canonicalName: 'Óleo de girassol', tacoId: 'TACO-269', unitName: 'colher de sopa', unitWeight: 13 },
  { canonicalName: 'Açúcar cristal refinado', tacoId: 'TACO-492', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Açúcar mascavo', tacoId: 'TACO-493', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Achocolatado em pó tradicional', tacoId: 'TACO-491', unitName: 'colher de sopa cheia', unitWeight: 20 },
  { canonicalName: 'Maionese tradicional com ovos', tacoId: 'TACO-524', unitName: 'colher de sopa', unitWeight: 20 },

  // 10. BEBIDAS
  { canonicalName: 'Café infusionado sem açúcar', tacoId: 'TACO-471', unitName: 'xícara de café', unitWeight: 50, baseUnit: 'ml' },
  { canonicalName: 'Refrigerante tipo cola', tacoId: 'TACO-480', unitName: 'lata', unitWeight: 350, baseUnit: 'ml' },
  { canonicalName: 'Refrigerante tipo guaraná', tacoId: 'TACO-481', unitName: 'lata', unitWeight: 350, baseUnit: 'ml' },
  { canonicalName: 'Cerveja pilsen comum', tacoId: 'TACO-474', unitName: 'lata', unitWeight: 350, baseUnit: 'ml' },

  // 11. OLEAGINOSAS E DOCES TRADICIONAIS
  { canonicalName: 'Amendoim torrado salgado', tacoId: 'TACO-558', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Castanha-de-caju torrada salgada', tacoId: 'TACO-588', unitName: 'unidade média', unitWeight: 5 },
  { canonicalName: 'Castanha-do-pará crua (castanha-do-brasil)', tacoId: 'TACO-589', unitName: 'unidade média', unitWeight: 5 },
  { canonicalName: 'Paçoca de amendoim tradicional', tacoId: 'TACO-579', unitName: 'rolha / tablete médio', unitWeight: 20 },
  { canonicalName: 'Chocolate ao leite tradicional', tacoId: 'TACO-495', unitName: 'quadradinho / tablete', unitWeight: 25 },
  { canonicalName: 'Doce de leite cremoso', tacoId: 'TACO-501', unitName: 'colher de sopa', unitWeight: 20 },
  { canonicalName: 'Goiabada (doce em pasta)', tacoId: 'TACO-198', unitName: 'fatia média', unitWeight: 40 },
];

function runBuild() {
  const rootDir = process.cwd().endsWith('backend') ? process.cwd() : path.join(process.cwd(), 'backend');
  const tacoPath = path.join(rootDir, 'data/taco-full.json');
  if (!fs.existsSync(tacoPath)) {
    console.error(`Arquivo TACO não encontrado em ${tacoPath}`);
    process.exit(1);
  }

  const tacoFoods: TacoItem[] = JSON.parse(fs.readFileSync(tacoPath, 'utf8'));
  const tacoMap = new Map<string, TacoItem>();
  for (const item of tacoFoods) {
    tacoMap.set(item.external_id, item);
  }

  console.log(`Carregados ${tacoFoods.length} alimentos da TACO.`);
  console.log(`Processando ${PHASE_1_MAPPINGS.length} alimentos canônicos da Fase 1...`);

  const outputFoods: CuratedOutputFood[] = [];
  const errors: string[] = [];
  const atwaterWarnings: string[] = [];
  const seenNames = new Set<string>();
  const seenIds = new Set<string>();

  for (const m of PHASE_1_MAPPINGS) {
    const src = tacoMap.get(m.tacoId);
    if (!src) {
      errors.push(`ID TACO não encontrado: ${m.tacoId} para "${m.canonicalName}"`);
      continue;
    }

    const normName = m.canonicalName.toLowerCase().trim();
    if (seenNames.has(normName)) {
      errors.push(`Nome duplicado: "${m.canonicalName}"`);
    }
    seenNames.add(normName);

    const extId = m.tacoId.toLowerCase();
    if (seenIds.has(extId)) {
      errors.push(`ID duplicado: "${extId}"`);
    }
    seenIds.add(extId);

    // Arredondamentos padronizados da Seção 6
    const calories = Math.round(src.calories);
    const proteins = Math.round(src.proteins * 10) / 10;
    const carbs = Math.round(src.carbs * 10) / 10;
    const fats = Math.round(src.fats * 10) / 10;

    // Checagem Atwater (4P + 4C + 9G)
    const atwater = 4 * proteins + 4 * carbs + 9 * fats;
    if (calories > 0) {
      const diff = Math.abs(atwater - calories) / calories;
      if (diff > 0.25) {
        atwaterWarnings.push(
          `Divergência Atwater > 25% em "${m.canonicalName}": informado=${calories} kcal vs calculado=${Math.round(atwater)} kcal`
        );
      }
    }

    // Checagem de soma de macros
    if (proteins + carbs + fats > 100.5) {
      errors.push(`Soma de macros > 100.5g em "${m.canonicalName}": ${(proteins + carbs + fats).toFixed(1)}g`);
    }

    // Checagem de unidade
    if (m.unitWeight <= 0 || m.unitWeight > 1000) {
      errors.push(`Peso de unidade suspeito em "${m.canonicalName}": ${m.unitWeight}`);
    }

    outputFoods.push({
      name: m.canonicalName,
      calories,
      proteins,
      carbs,
      fats,
      base_unit: m.baseUnit || 'g',
      serving_weight: 100,
      unit_name: m.unitName,
      unit_weight: m.unitWeight,
      source: 'TACO',
      source_ref: `TACO 4ª ed., código ${m.tacoId.replace('TACO-', '')} (${src.name})`,
      external_id: extId,
    });
  }

  // Preserva o exemplo curado do Whey Protein da Growth adicionado na Fase 3
  outputFoods.push({
    name: 'Whey Protein Concentrado 80% (Growth)',
    calories: 407,
    proteins: 76.7,
    carbs: 13.3,
    fats: 5.3,
    base_unit: 'g',
    serving_weight: 100,
    unit_name: 'dosador (scoop)',
    unit_weight: 30,
    source: 'Growth Supplements',
    source_ref: 'Rótulo 100% Whey Concentrado 80% (Growth Supplements, porção de 30g)',
    external_id: 'growth-whey-conc-80',
  });

  console.log(`Relatório de Validação Interna:`);
  console.log(`- Alimentos mapeados com sucesso: ${outputFoods.length}`);
  console.log(`- Erros críticos: ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach(e => console.error('  * ERRO:', e));
    process.exit(1);
  }

  console.log(`- Alertas de conferência Atwater: ${atwaterWarnings.length}`);
  atwaterWarnings.forEach(w => console.warn('  ! AVISO:', w));

  const targetPath = path.join(rootDir, 'data/curated-foods.json');
  fs.writeFileSync(targetPath, JSON.stringify(outputFoods, null, 2), 'utf8');
  console.log(`\n✅ Arquivo gerado com sucesso em: ${targetPath}`);
}

runBuild();
