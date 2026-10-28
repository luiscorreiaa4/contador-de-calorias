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

interface TbcaItem {
  code: string;
  sourceName: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

interface Phase1MappingItem {
  canonicalName: string;
  tacoId: string;
  unitName: string;
  unitWeight: number;
  baseUnit?: 'g' | 'ml';
}

interface Phase2MappingItem {
  canonicalName: string;
  tbcaCode: string;
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

// ---------------------------------------------------------
// MAPEAMENTOS FASE 1: ITENS DO DIA A DIA (TACO 4ª Edição)
// ---------------------------------------------------------
const PHASE_1_MAPPINGS: Phase1MappingItem[] = [
  // Cereais, grãos e massas
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

  // Leguminosas
  { canonicalName: 'Feijão carioca cozido', tacoId: 'TACO-561', unitName: 'concha média', unitWeight: 130 },
  { canonicalName: 'Feijão carioca cru', tacoId: 'TACO-562', unitName: 'concha média', unitWeight: 100 },
  { canonicalName: 'Feijão preto cozido', tacoId: 'TACO-567', unitName: 'concha média', unitWeight: 130 },
  { canonicalName: 'Feijão fradinho cozido (feijão-de-corda)', tacoId: 'TACO-563', unitName: 'concha média', unitWeight: 130 },
  { canonicalName: 'Lentilha cozida', tacoId: 'TACO-577', unitName: 'concha média', unitWeight: 130 },
  { canonicalName: 'Grão-de-bico cru', tacoId: 'TACO-575', unitName: 'concha média', unitWeight: 100 },
  { canonicalName: 'Ervilha em conserva drenada', tacoId: 'TACO-560', unitName: 'colher de sopa cheia', unitWeight: 20 },

  // Pães e similares
  { canonicalName: 'Pão francês (pão de sal, cacetinho)', tacoId: 'TACO-53', unitName: 'unidade', unitWeight: 50 },
  { canonicalName: 'Pão de forma integral', tacoId: 'TACO-52', unitName: 'fatia', unitWeight: 25 },
  { canonicalName: 'Pão de queijo assado', tacoId: 'TACO-140', unitName: 'unidade média', unitWeight: 40 },
  { canonicalName: 'Torrada de pão francês', tacoId: 'TACO-63', unitName: 'unidade', unitWeight: 10 },
  { canonicalName: 'Biscoito cream cracker (água e sal)', tacoId: 'TACO-13', unitName: 'unidade', unitWeight: 6 },
  { canonicalName: 'Biscoito doce de maisena', tacoId: 'TACO-8', unitName: 'unidade', unitWeight: 5 },
  { canonicalName: 'Biscoito recheado de chocolate', tacoId: 'TACO-9', unitName: 'unidade', unitWeight: 12 },
  { canonicalName: 'Biscoito recheado de morango', tacoId: 'TACO-10', unitName: 'unidade', unitWeight: 12 },

  // Carnes, aves, peixes e ovos
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

  // Leite e derivados
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

  // Tubérculos e raízes
  { canonicalName: 'Batata inglesa cozida', tacoId: 'TACO-91', unitName: 'unidade média', unitWeight: 140 },
  { canonicalName: 'Batata inglesa frita', tacoId: 'TACO-93', unitName: 'escumadeira / porção média', unitWeight: 100 },
  { canonicalName: 'Batata doce cozida', tacoId: 'TACO-88', unitName: 'unidade média', unitWeight: 150 },
  { canonicalName: 'Batata baroa cozida (mandioquinha)', tacoId: 'TACO-86', unitName: 'unidade média', unitWeight: 100 },
  { canonicalName: 'Mandioca cozida (aipim, macaxeira)', tacoId: 'TACO-129', unitName: 'pedaço médio', unitWeight: 100 },
  { canonicalName: 'Mandioca frita', tacoId: 'TACO-132', unitName: 'pedaço médio', unitWeight: 50 },
  { canonicalName: 'Inhame cru', tacoId: 'TACO-126', unitName: 'unidade média', unitWeight: 150 },
  { canonicalName: 'Cará cozido', tacoId: 'TACO-102', unitName: 'pedaço médio', unitWeight: 100 },

  // Frutas
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

  // Verduras e legumes
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

  // Gorduras, açúcares e condimentos
  { canonicalName: 'Azeite de oliva extra virgem', tacoId: 'TACO-260', unitName: 'colher de sopa', unitWeight: 13 },
  { canonicalName: 'Óleo de soja vegetal', tacoId: 'TACO-272', unitName: 'colher de sopa', unitWeight: 13 },
  { canonicalName: 'Óleo de milho', tacoId: 'TACO-270', unitName: 'colher de sopa', unitWeight: 13 },
  { canonicalName: 'Óleo de girassol', tacoId: 'TACO-269', unitName: 'colher de sopa', unitWeight: 13 },
  { canonicalName: 'Açúcar cristal refinado', tacoId: 'TACO-492', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Açúcar mascavo', tacoId: 'TACO-493', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Achocolatado em pó tradicional', tacoId: 'TACO-491', unitName: 'colher de sopa cheia', unitWeight: 20 },
  { canonicalName: 'Maionese tradicional com ovos', tacoId: 'TACO-524', unitName: 'colher de sopa', unitWeight: 20 },

  // Bebidas
  { canonicalName: 'Café infusionado sem açúcar', tacoId: 'TACO-471', unitName: 'xícara de café', unitWeight: 50, baseUnit: 'ml' },
  { canonicalName: 'Refrigerante tipo cola', tacoId: 'TACO-480', unitName: 'lata', unitWeight: 350, baseUnit: 'ml' },
  { canonicalName: 'Refrigerante tipo guaraná', tacoId: 'TACO-481', unitName: 'lata', unitWeight: 350, baseUnit: 'ml' },
  { canonicalName: 'Cerveja pilsen comum', tacoId: 'TACO-474', unitName: 'lata', unitWeight: 350, baseUnit: 'ml' },

  // Oleaginosas e doces tradicionais
  { canonicalName: 'Amendoim torrado salgado', tacoId: 'TACO-558', unitName: 'colher de sopa cheia', unitWeight: 15 },
  { canonicalName: 'Castanha-de-caju torrada salgada', tacoId: 'TACO-588', unitName: 'unidade média', unitWeight: 5 },
  { canonicalName: 'Castanha-do-pará crua (castanha-do-brasil)', tacoId: 'TACO-589', unitName: 'unidade média', unitWeight: 5 },
  { canonicalName: 'Paçoca de amendoim tradicional', tacoId: 'TACO-579', unitName: 'rolha / tablete médio', unitWeight: 20 },
  { canonicalName: 'Chocolate ao leite tradicional', tacoId: 'TACO-495', unitName: 'quadradinho / tablete', unitWeight: 25 },
  { canonicalName: 'Doce de leite cremoso', tacoId: 'TACO-501', unitName: 'colher de sopa', unitWeight: 20 },
  { canonicalName: 'Goiabada (doce em pasta)', tacoId: 'TACO-198', unitName: 'fatia média', unitWeight: 40 },
];

// ---------------------------------------------------------
// MAPEAMENTOS FASE 2: PREPARAÇÕES E LANCHES (TBCA v7.2)
// ---------------------------------------------------------
const PHASE_2_MAPPINGS: Phase2MappingItem[] = [
  // 1. REFEIÇÕES E PRATOS TRADICIONAIS BRASILEIROS
  { canonicalName: 'Feijoada tradicional completa (feijão preto, carnes e paio)', tbcaCode: 'BRC0198T', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Feijoada vegetariana com legumes', tbcaCode: 'BRC0172T', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Feijoada de frutos do mar', tbcaCode: 'BRC0364E', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Arroz e feijão carioca misturado (prato feito)', tbcaCode: 'BRC0004S', unitName: 'colher de sopa cheia', unitWeight: 35 },
  { canonicalName: 'Baião de dois tradicional (arroz e feijão de corda)', tbcaCode: 'BRC0188A', unitName: 'colher de sopa cheia', unitWeight: 35 },
  { canonicalName: 'Strogonoff de frango (estrogonofe)', tbcaCode: 'BRC0911F', unitName: 'concha média', unitWeight: 130 },
  { canonicalName: 'Strogonoff de carne bovina (estrogonofe)', tbcaCode: 'BRC0910F', unitName: 'concha média', unitWeight: 130 },
  { canonicalName: 'Strogonoff de camarão (estrogonofe)', tbcaCode: 'BRC0372E', unitName: 'concha média', unitWeight: 130 },
  { canonicalName: 'Escondidinho de carne seca (charque com mandioca)', tbcaCode: 'BRC0761B', unitName: 'porção / fatia média', unitWeight: 150 },
  { canonicalName: 'Escondidinho de frango (com purê de batata)', tbcaCode: 'BRC0762B', unitName: 'porção / fatia média', unitWeight: 150 },
  { canonicalName: 'Moqueca de camarão com leite de coco e dendê', tbcaCode: 'BRC0253E', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Moqueca de peixe e frutos do mar', tbcaCode: 'BRC0255E', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Vatapá tradicional baiano', tbcaCode: 'BRC0892A', unitName: 'colher de sopa cheia', unitWeight: 30 },
  { canonicalName: 'Acarajé frito no azeite de dendê', tbcaCode: 'BRC0203T', unitName: 'unidade média', unitWeight: 100 },
  { canonicalName: 'Bife à parmegiana bovino com queijo e molho', tbcaCode: 'BRC0293F', unitName: 'filé / bife médio', unitWeight: 130 },
  { canonicalName: 'Filé de frango à parmegiana com queijo e molho', tbcaCode: 'BRC0978F', unitName: 'filé médio', unitWeight: 130 },
  { canonicalName: 'Prato comercial tradicional (arroz, feijão, carne refogada e quibebe)', tbcaCode: 'BRC0001S', unitName: 'prato raso médio', unitWeight: 260 },
  { canonicalName: 'Prato comercial clássico (arroz polido, feijão carioca e batata sauté)', tbcaCode: 'BRC0002S', unitName: 'prato raso médio', unitWeight: 200 },
  { canonicalName: 'Carne moída refogada com molho de tomate', tbcaCode: 'BRC0726F', unitName: 'colher de sopa cheia', unitWeight: 30 },
  { canonicalName: 'Carne bovina com mandioca ensopada (vaca atolada)', tbcaCode: 'BRC0742B', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Risoto de legumes com arroz', tbcaCode: 'BRC0623A', unitName: 'colher de sopa cheia', unitWeight: 35 },
  { canonicalName: 'Risoto de camarão com arroz', tbcaCode: 'BRC0625A', unitName: 'colher de sopa cheia', unitWeight: 35 },
  { canonicalName: 'Risoto de frutos do mar com arroz', tbcaCode: 'BRC0624A', unitName: 'colher de sopa cheia', unitWeight: 35 },
  { canonicalName: 'Polenta cozida com molho à bolonhesa', tbcaCode: 'BRC0673A', unitName: 'colher de sopa cheia', unitWeight: 40 },
  { canonicalName: 'Polenta cozida simples de milho (fubá)', tbcaCode: 'BRC0143A', unitName: 'colher de sopa cheia', unitWeight: 35 },
  { canonicalName: 'Quibebe de carne seca (abóbora com charque)', tbcaCode: 'BRC0959B', unitName: 'colher de sopa cheia', unitWeight: 30 },
  { canonicalName: 'Quibebe tradicional de abóbora', tbcaCode: 'BRC1204B', unitName: 'colher de sopa cheia', unitWeight: 30 },
  { canonicalName: 'Cestinha de frutos do mar com massa de pastel', tbcaCode: 'BRC0299E', unitName: 'unidade', unitWeight: 50 },

  // 2. MASSAS, TORTAS E PANQUECAS
  { canonicalName: 'Lasanha à bolonhesa tradicional assada', tbcaCode: 'BRC0395A', unitName: 'fatia / porção média', unitWeight: 200 },
  { canonicalName: 'Lasanha quatro queijos assada', tbcaCode: 'BRC0113A', unitName: 'fatia / porção média', unitWeight: 200 },
  { canonicalName: 'Lasanha de frango caseira', tbcaCode: 'BRC0558A', unitName: 'fatia / porção média', unitWeight: 200 },
  { canonicalName: 'Lasanha de queijos com molho branco', tbcaCode: 'BRC0894A', unitName: 'fatia / porção média', unitWeight: 200 },
  { canonicalName: 'Lasanha de berinjela à bolonhesa', tbcaCode: 'BRC0684B', unitName: 'fatia / porção média', unitWeight: 200 },
  { canonicalName: 'Lasanha de abobrinha com molho bolonhesa', tbcaCode: 'BRC1025B', unitName: 'fatia / porção média', unitWeight: 200 },
  { canonicalName: 'Lasanha vegetariana de legumes', tbcaCode: 'BRC0576A', unitName: 'fatia / porção média', unitWeight: 200 },
  { canonicalName: 'Macarronada à bolonhesa com carne moída', tbcaCode: 'BRC0238A', unitName: 'pegador médio', unitWeight: 120 },
  { canonicalName: 'Macarrão com alho e óleo', tbcaCode: 'BRC0214A', unitName: 'pegador médio', unitWeight: 100 },
  { canonicalName: 'Macarrão ao molho branco (bechamel)', tbcaCode: 'BRC0220A', unitName: 'pegador médio', unitWeight: 120 },
  { canonicalName: 'Macarrão com molho de tomate e frango', tbcaCode: 'BRC0613A', unitName: 'pegador médio', unitWeight: 120 },
  { canonicalName: 'Macarrão com molho de tomate e linguiça calabresa', tbcaCode: 'BRC0853A', unitName: 'pegador médio', unitWeight: 120 },
  { canonicalName: 'Macarrão com presunto, ervilha e molho branco (parisiense)', tbcaCode: 'BRC0600A', unitName: 'pegador médio', unitWeight: 120 },
  { canonicalName: 'Macarrão integral ao molho de tomate', tbcaCode: 'BRC0235A', unitName: 'pegador médio', unitWeight: 120 },
  { canonicalName: 'Macarrão integral à bolonhesa', tbcaCode: 'BRC0239A', unitName: 'pegador médio', unitWeight: 120 },
  { canonicalName: 'Nhoque de batata ao molho de tomate', tbcaCode: 'BRC0464B', unitName: 'escumadeira / porção média', unitWeight: 140 },
  { canonicalName: 'Nhoque de batata cozido simples (sem molho)', tbcaCode: 'BRC0920B', unitName: 'escumadeira / porção média', unitWeight: 120 },
  { canonicalName: 'Panqueca de carne moída com molho', tbcaCode: 'BRC0814A', unitName: 'unidade média', unitWeight: 90 },
  { canonicalName: 'Panqueca de frango desfiado com requeijão', tbcaCode: 'BRC0585A', unitName: 'unidade média', unitWeight: 90 },
  { canonicalName: 'Panqueca de ricota com espinafre ao molho de tomate', tbcaCode: 'BRC0582A', unitName: 'unidade média', unitWeight: 90 },
  { canonicalName: 'Empadão de frango com requeijão assado', tbcaCode: 'BRC0751A', unitName: 'fatia média', unitWeight: 120 },
  { canonicalName: 'Quiche de alho-poró assado', tbcaCode: 'BRC0652A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Quiche de queijo assado', tbcaCode: 'BRC1108A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Quiche de espinafre assado', tbcaCode: 'BRC0653A', unitName: 'fatia média', unitWeight: 100 },

  // 3. CALDOS E SOPAS
  { canonicalName: 'Caldo verde tradicional com couve e linguiça', tbcaCode: 'BRC0681B', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Canja de galinha com arroz e legumes', tbcaCode: 'BRC0891B', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Sopa de carne bovina com macarrão e legumes', tbcaCode: 'BRC1058A', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Sopa de legumes caseira com sal', tbcaCode: 'BRC0734B', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Sopa de macarrão com vegetais', tbcaCode: 'BRC1054A', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Sopa de fubá com couve e linguiça calabresa', tbcaCode: 'BRC0666A', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Sopa de mandioca tradicional (aipim, macaxeira)', tbcaCode: 'BRC0740B', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Sopa creme de ervilha preparada', tbcaCode: 'BRC0125B', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Sopa creme de cebola preparada', tbcaCode: 'BRC0833A', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Sopa de batata inglesa caseira', tbcaCode: 'BRC0143B', unitName: 'concha média', unitWeight: 140 },

  // 4. SALGADOS DE BOTECO E PADARIA
  { canonicalName: 'Coxinha de frango frita tradicional', tbcaCode: 'BRC0100F', unitName: 'unidade média', unitWeight: 80 },
  { canonicalName: 'Pastel de carne bovina frito', tbcaCode: 'BRC0166A', unitName: 'unidade média', unitWeight: 80 },
  { canonicalName: 'Pastel de queijo frito', tbcaCode: 'BRC0167A', unitName: 'unidade média', unitWeight: 80 },
  { canonicalName: 'Pastel de forno de carne bovina assado', tbcaCode: 'BRC0741A', unitName: 'unidade média', unitWeight: 90 },
  { canonicalName: 'Pastel de forno de queijo assado', tbcaCode: 'BRC0740A', unitName: 'unidade média', unitWeight: 90 },
  { canonicalName: 'Pastel de forno de frango com requeijão', tbcaCode: 'BRC0744A', unitName: 'unidade média', unitWeight: 90 },
  { canonicalName: 'Pastel de forno de palmito com requeijão', tbcaCode: 'BRC0743A', unitName: 'unidade média', unitWeight: 90 },
  { canonicalName: 'Pastel de frango frito com queijo e milho', tbcaCode: 'BRC1064A', unitName: 'unidade média', unitWeight: 80 },
  { canonicalName: 'Esfirra de carne moída assada', tbcaCode: 'BRC0422A', unitName: 'unidade média', unitWeight: 60 },
  { canonicalName: 'Esfirra de frango assada', tbcaCode: 'BRC0424A', unitName: 'unidade média', unitWeight: 60 },
  { canonicalName: 'Esfirra de ricota assada', tbcaCode: 'BRC0423A', unitName: 'unidade média', unitWeight: 60 },
  { canonicalName: 'Esfirra de queijo com requeijão (tipo catupiry)', tbcaCode: 'BRC0953A', unitName: 'unidade média', unitWeight: 60 },
  { canonicalName: 'Esfirra de queijo muçarela assada', tbcaCode: 'BRC1146A', unitName: 'unidade média', unitWeight: 60 },
  { canonicalName: 'Empada de frango assada caseira', tbcaCode: 'BRC0443A', unitName: 'unidade média', unitWeight: 50 },
  { canonicalName: 'Empada de queijo minas assada', tbcaCode: 'BRC0444A', unitName: 'unidade média', unitWeight: 50 },
  { canonicalName: 'Empada de carne bovina assada', tbcaCode: 'BRC0445A', unitName: 'unidade média', unitWeight: 50 },
  { canonicalName: 'Empada de camarão assada', tbcaCode: 'BRC0446A', unitName: 'unidade média', unitWeight: 50 },
  { canonicalName: 'Quibe bovino frito tradicional (kibe)', tbcaCode: 'BRC0877F', unitName: 'unidade média', unitWeight: 60 },
  { canonicalName: 'Quibe bovino assado (kibe)', tbcaCode: 'BRC0830F', unitName: 'pedaço / fatia média', unitWeight: 80 },
  { canonicalName: 'Quibe cru de carne bovina temperado', tbcaCode: 'BRC0921F', unitName: 'colher de sopa cheia', unitWeight: 30 },
  { canonicalName: 'Quibe assado com abóbora japonesa (cabotiá)', tbcaCode: 'BRC1079B', unitName: 'fatia média', unitWeight: 80 },
  { canonicalName: 'Quibe vegetariano assado de lentilha', tbcaCode: 'BRC0245T', unitName: 'fatia média', unitWeight: 80 },
  { canonicalName: 'Croquete de carne bovina frito', tbcaCode: 'BRC0476F', unitName: 'unidade média', unitWeight: 40 },
  { canonicalName: 'Risole de queijo muçarela frito', tbcaCode: 'BRC0440A', unitName: 'unidade média', unitWeight: 45 },
  { canonicalName: 'Risole de carne bovina frito', tbcaCode: 'BRC0441A', unitName: 'unidade média', unitWeight: 45 },
  { canonicalName: 'Risole de camarão frito', tbcaCode: 'BRC0442A', unitName: 'unidade média', unitWeight: 45 },
  { canonicalName: 'Nuggets de frango empanados fritos', tbcaCode: 'BRC0474F', unitName: 'unidade', unitWeight: 25 },
  { canonicalName: 'Croissant assado recheado com brigadeiro', tbcaCode: 'BRC0825A', unitName: 'unidade média', unitWeight: 70 },

  // 5. SANDUÍCHES E FAST FOOD
  { canonicalName: 'Misto-quente tradicional (pão francês com presunto e muçarela)', tbcaCode: 'BRC0262A', unitName: 'unidade', unitWeight: 110 },
  { canonicalName: 'Misto-quente em pão de forma com maionese', tbcaCode: 'BRC0260A', unitName: 'unidade', unitWeight: 100 },
  { canonicalName: 'Misto-quente integral (pão de forma integral com presunto e queijo)', tbcaCode: 'BRC0261A', unitName: 'unidade', unitWeight: 95 },
  { canonicalName: 'Bauru tradicional (pão francês, presunto, muçarela e tomate)', tbcaCode: 'BRC0412A', unitName: 'unidade', unitWeight: 130 },
  { canonicalName: 'Hambúrguer bovino simples no pão (com catchup e mostarda)', tbcaCode: 'BRC0244A', unitName: 'sanduíche completo', unitWeight: 130 },
  { canonicalName: 'Cheeseburguer tradicional (pão, carne e queijo prato)', tbcaCode: 'BRC0248A', unitName: 'sanduíche completo', unitWeight: 140 },
  { canonicalName: 'X-Salada completo (pão, hambúrguer, queijo, maionese, alface e tomate)', tbcaCode: 'BRC0252A', unitName: 'sanduíche completo', unitWeight: 180 },
  { canonicalName: 'X-Egg tradicional (pão, hambúrguer bovino e ovo frito)', tbcaCode: 'BRC0291A', unitName: 'sanduíche completo', unitWeight: 170 },
  { canonicalName: 'X-Egg com salada e maionese (pão, carne, ovo frito, queijo e salada)', tbcaCode: 'BRC0293A', unitName: 'sanduíche completo', unitWeight: 200 },
  { canonicalName: 'Hambúrguer bovino grelhado com queijo prato e picles', tbcaCode: 'BRC0247A', unitName: 'sanduíche completo', unitWeight: 150 },
  { canonicalName: 'Hambúrguer de frango grelhado no prato', tbcaCode: 'BRC0919F', unitName: 'unidade', unitWeight: 80 },
  { canonicalName: 'Hambúrguer vegetariano de grão-de-bico grelhado', tbcaCode: 'BRC0244T', unitName: 'unidade', unitWeight: 80 },
  { canonicalName: 'Hambúrguer de soja grelhado', tbcaCode: 'BRC0207T', unitName: 'unidade', unitWeight: 80 },
  { canonicalName: 'Cachorro-quente simples (pão, salsicha, catchup e mostarda)', tbcaCode: 'BRC0240A', unitName: 'unidade', unitWeight: 120 },
  { canonicalName: 'Cachorro-quente completo prensado (pão, salsicha, purê, batata palha e milho)', tbcaCode: 'BRC0241A', unitName: 'unidade', unitWeight: 220 },
  { canonicalName: 'Cachorro-quente com molho de tomate, ervilha e batata palha', tbcaCode: 'BRC0242A', unitName: 'unidade', unitWeight: 180 },
  { canonicalName: 'Wrap de frango com salada no pão folha', tbcaCode: 'BRC1105F', unitName: 'unidade', unitWeight: 150 },
  { canonicalName: 'Crepe salgado de presunto com muçarela', tbcaCode: 'BRC0438A', unitName: 'unidade', unitWeight: 120 },
  { canonicalName: 'Sanduíche Big Mac (Fast Food)', tbcaCode: 'BRC0001M', unitName: 'unidade', unitWeight: 215 },
  { canonicalName: 'Cheeseburguer de fast food (estilo McDonald´s)', tbcaCode: 'BRC0007M', unitName: 'unidade', unitWeight: 115 },
  { canonicalName: 'Sanduíche Whopper com queijo (Burguer King)', tbcaCode: 'BRC0009M', unitName: 'unidade', unitWeight: 290 },
  { canonicalName: 'Batata frita palito de fast food (média)', tbcaCode: 'BRC0006M', unitName: 'porção média', unitWeight: 100 },
  { canonicalName: 'Tiras de frango crocante empanadas e fritas (KFC)', tbcaCode: 'BRC0012M', unitName: 'porção / pedaço', unitWeight: 60 },

  // 6. PIZZAS (FATIAS DE ~100G)
  { canonicalName: 'Pizza de muçarela artesanal assada (fatia)', tbcaCode: 'BRC0225A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza de calabresa artesanal (fatia)', tbcaCode: 'BRC0425A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza de frango com requeijão / catupiry (fatia)', tbcaCode: 'BRC0678A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza quatro queijos caseira (fatia)', tbcaCode: 'BRC0682A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza portuguesa assada (fatia)', tbcaCode: 'BRC0427A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza marguerita com muçarela e manjericão (fatia)', tbcaCode: 'BRC0685A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza de lombo canadense com queijo (fatia)', tbcaCode: 'BRC0676A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza de atum com muçarela (fatia)', tbcaCode: 'BRC0677A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza de pepperoni caseira (fatia)', tbcaCode: 'BRC0686A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza de rúcula com tomate seco e muçarela de búfala (fatia)', tbcaCode: 'BRC0679A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza de palmito com requeijão (fatia)', tbcaCode: 'BRC0875A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza vegetariana de legumes (fatia)', tbcaCode: 'BRC0687A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza doce de brigadeiro com morango (fatia)', tbcaCode: 'BRC0689A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pizza doce de banana com leite condensado e canela (fatia)', tbcaCode: 'BRC0691A', unitName: 'fatia média', unitWeight: 100 },

  // 7. TAPIOCAS, CUSCUZ E PRATOS TÍPICOS REGIONAIS
  { canonicalName: 'Tapioca com manteiga e sal', tbcaCode: 'BRC0137B', unitName: 'unidade média', unitWeight: 90 },
  { canonicalName: 'Tapioca com queijo coalho e carne seca (charque)', tbcaCode: 'BRC0840B', unitName: 'unidade média', unitWeight: 130 },
  { canonicalName: 'Tapioca doce com leite condensado e coco ralado', tbcaCode: 'BRC0839B', unitName: 'unidade média', unitWeight: 130 },
  { canonicalName: 'Cuscuz paulista tradicional (com peixe e legumes)', tbcaCode: 'BRC0191A', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Cuscuz de tapioca doce com coco e leite de coco', tbcaCode: 'BRC0997B', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Cuscuz de tapioca com legumes cozidos', tbcaCode: 'BRC1042B', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pamonha salgada de milho verde com queijo muçarela', tbcaCode: 'BRC1050A', unitName: 'unidade média', unitWeight: 150 },
  { canonicalName: 'Pamonha doce de milho verde com coco e açúcar', tbcaCode: 'BRC1051A', unitName: 'unidade média', unitWeight: 150 },
  { canonicalName: 'Canjica doce de milho branco com leite integral e açúcar (munguzá)', tbcaCode: 'BRC0184A', unitName: 'concha média', unitWeight: 140 },
  { canonicalName: 'Curau de milho verde cozido com canela', tbcaCode: 'BRC0140A', unitName: 'taça / potinho médio', unitWeight: 120 },
  { canonicalName: 'Arroz doce com leite condensado e canela', tbcaCode: 'BRC0914A', unitName: 'taça / potinho médio', unitWeight: 120 },
  { canonicalName: 'Arroz doce tradicional com açúcar e canela', tbcaCode: 'BRC0913A', unitName: 'taça / potinho médio', unitWeight: 120 },
  { canonicalName: 'Tabule de trigo para quibe com hortelã e tomate', tbcaCode: 'BRC0826B', unitName: 'colher de sopa cheia', unitWeight: 30 },

  // 8. BOLOS E TORTAS DOCES
  { canonicalName: 'Bolo simples caseiro de trigo (bolo da vovó)', tbcaCode: 'BRC0197A', unitName: 'fatia média', unitWeight: 60 },
  { canonicalName: 'Bolo de fubá tradicional caseiro', tbcaCode: 'BRC0226A', unitName: 'fatia média', unitWeight: 60 },
  { canonicalName: 'Bolo de cenoura caseiro com cobertura de chocolate', tbcaCode: 'BRC0822A', unitName: 'fatia média', unitWeight: 75 },
  { canonicalName: 'Bolo de cenoura recheado com brigadeiro e cobertura', tbcaCode: 'BRC0821A', unitName: 'fatia média', unitWeight: 90 },
  { canonicalName: 'Bolo de chocolate caseiro com cobertura de brigadeiro', tbcaCode: 'BRC0823A', unitName: 'fatia média', unitWeight: 80 },
  { canonicalName: 'Bolo de coco sem recheio artesanal', tbcaCode: 'BRC0227A', unitName: 'fatia média', unitWeight: 60 },
  { canonicalName: 'Bolo de laranja caseiro', tbcaCode: 'BRC0067A', unitName: 'fatia média', unitWeight: 60 },
  { canonicalName: 'Bolo de milho cremoso', tbcaCode: 'BRC0080A', unitName: 'fatia média', unitWeight: 60 },
  { canonicalName: 'Bolo de mandioca e aipim cremoso', tbcaCode: 'BRC0077A', unitName: 'fatia média', unitWeight: 60 },
  { canonicalName: 'Bolo de abacaxi caseiro', tbcaCode: 'BRC0829A', unitName: 'fatia média', unitWeight: 70 },
  { canonicalName: 'Bolo de Páscoa com gotas de chocolate (panetone / chocotone)', tbcaCode: 'BRC0075A', unitName: 'fatia média', unitWeight: 80 },
  { canonicalName: 'Torta doce de chocolate mousse', tbcaCode: 'BRC0034K', unitName: 'fatia média', unitWeight: 90 },
  { canonicalName: 'Torta doce de limão com merengue mousse', tbcaCode: 'BRC0035K', unitName: 'fatia média', unitWeight: 90 },
  { canonicalName: 'Torta doce de maracujá mousse', tbcaCode: 'BRC0036K', unitName: 'fatia média', unitWeight: 90 },

  // 9. DOCES TRADICIONAIS E SOBREMESAS
  { canonicalName: 'Brigadeiro tradicional enrolado com chocolate ao leite (festa)', tbcaCode: 'BRC0190K', unitName: 'unidade de festa', unitWeight: 15 },
  { canonicalName: 'Beijinho de coco tradicional enrolado', tbcaCode: 'BRC0191K', unitName: 'unidade de festa', unitWeight: 15 },
  { canonicalName: 'Pudim de leite condensado artesanal com calda de caramelo', tbcaCode: 'BRC0227K', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Pudim de pão caseiro com calda', tbcaCode: 'BRC0122G', unitName: 'fatia média', unitWeight: 100 },
  { canonicalName: 'Mousse de chocolate tradicional aerada', tbcaCode: 'BRC0063K', unitName: 'taça pequena', unitWeight: 80 },
  { canonicalName: 'Mousse de maracujá tradicional', tbcaCode: 'BRC0065K', unitName: 'taça pequena', unitWeight: 80 },
  { canonicalName: 'Mousse de limão tradicional', tbcaCode: 'BRC0064K', unitName: 'taça pequena', unitWeight: 80 },
  { canonicalName: 'Cocada branca artesanal tradicional', tbcaCode: 'BRC0012K', unitName: 'unidade média', unitWeight: 40 },
  { canonicalName: 'Quindim artesanal de ovos e coco', tbcaCode: 'BRC0031K', unitName: 'unidade média', unitWeight: 40 },
  { canonicalName: 'Churros frito recheado com doce de leite e açúcar', tbcaCode: 'BRC0918A', unitName: 'unidade média', unitWeight: 75 },
  { canonicalName: 'Churros frito recheado com brigadeiro', tbcaCode: 'BRC0920A', unitName: 'unidade média', unitWeight: 75 },
  { canonicalName: 'Sonho assado com recheio de brigadeiro e cobertura', tbcaCode: 'BRC1053A', unitName: 'unidade média', unitWeight: 80 },
  { canonicalName: 'Pão de mel tradicional recheado com brigadeiro e chocolate', tbcaCode: 'BRC0917A', unitName: 'unidade média', unitWeight: 50 },
  { canonicalName: 'Bomba doce (éclair) recheada com brigadeiro', tbcaCode: 'BRC0192K', unitName: 'unidade média', unitWeight: 60 },
  { canonicalName: 'Canudinho recheado com brigadeiro', tbcaCode: 'BRC0147K', unitName: 'unidade média', unitWeight: 30 },
  { canonicalName: 'Petit gâteau de chocolate quente com calda', tbcaCode: 'BRC0121K', unitName: 'unidade média', unitWeight: 100 },
  { canonicalName: 'Açaí na tigela com xarope de guaraná e glucose', tbcaCode: 'BRC0095C', unitName: 'tigela média', unitWeight: 200, baseUnit: 'g' },

  // 10. SOBREMESAS GELADAS E SORVETES
  { canonicalName: 'Sorvete de massa tradicional de chocolate e creme', tbcaCode: 'BRC0141K', unitName: 'bola de sorvete', unitWeight: 60 },
  { canonicalName: 'Sorvete sundae com calda de chocolate', tbcaCode: 'BRC0099K', unitName: 'taça / copo médio', unitWeight: 120 },
  { canonicalName: 'Sorvete de casquinha tradicional (cone)', tbcaCode: 'BRC0193K', unitName: 'unidade', unitWeight: 100 },
  { canonicalName: 'Milk-shake de chocolate tradicional com calda', tbcaCode: 'BRC0144H', unitName: 'copo médio', unitWeight: 300, baseUnit: 'ml' },
  { canonicalName: 'Crepe doce de banana com chocolate', tbcaCode: 'BRC0437A', unitName: 'unidade média', unitWeight: 120 },
];

function runBuildPhase2() {
  const rootDir = process.cwd().endsWith('backend') ? process.cwd() : path.join(process.cwd(), 'backend');
  const tacoPath = path.join(rootDir, 'data/taco-full.json');
  const tbcaPath = path.join(rootDir, 'data/tbca-foods.json');

  if (!fs.existsSync(tacoPath)) {
    console.error(`Arquivo TACO não encontrado em ${tacoPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(tbcaPath)) {
    console.error(`Arquivo TBCA não encontrado em ${tbcaPath}`);
    process.exit(1);
  }

  const tacoFoods: TacoItem[] = JSON.parse(fs.readFileSync(tacoPath, 'utf8'));
  const tacoMap = new Map<string, TacoItem>();
  for (const item of tacoFoods) {
    tacoMap.set(item.external_id, item);
  }

  const tbcaFoods: TbcaItem[] = JSON.parse(fs.readFileSync(tbcaPath, 'utf8'));
  const tbcaMap = new Map<string, TbcaItem>();
  for (const item of tbcaFoods) {
    tbcaMap.set(item.code, item);
  }

  console.log(`Carregados ${tacoFoods.length} alimentos da TACO e ${tbcaFoods.length} alimentos da TBCA.`);
  console.log(`Processando Fase 1 (${PHASE_1_MAPPINGS.length} itens) + Fase 2 (${PHASE_2_MAPPINGS.length} itens)...`);

  const outputFoods: CuratedOutputFood[] = [];
  const errors: string[] = [];
  const atwaterWarnings: string[] = [];
  const seenNames = new Set<string>();
  const seenIds = new Set<string>();

  // Processar Fase 1 (TACO)
  for (const m of PHASE_1_MAPPINGS) {
    const src = tacoMap.get(m.tacoId);
    if (!src) {
      errors.push(`ID TACO não encontrado: ${m.tacoId} para "${m.canonicalName}"`);
      continue;
    }

    const normName = m.canonicalName.toLowerCase().trim();
    if (seenNames.has(normName)) {
      errors.push(`Nome duplicado na Fase 1: "${m.canonicalName}"`);
    }
    seenNames.add(normName);

    const extId = m.tacoId.toLowerCase();
    if (seenIds.has(extId)) {
      errors.push(`ID duplicado na Fase 1: "${extId}"`);
    }
    seenIds.add(extId);

    const calories = Math.round(src.calories);
    const proteins = Math.round(src.proteins * 10) / 10;
    const carbs = Math.round(src.carbs * 10) / 10;
    const fats = Math.round(src.fats * 10) / 10;

    const atwater = 4 * proteins + 4 * carbs + 9 * fats;
    if (calories > 0) {
      const diff = Math.abs(atwater - calories) / calories;
      if (diff > 0.25) {
        atwaterWarnings.push(
          `Divergência Atwater > 25% em "${m.canonicalName}": inf=${calories} kcal vs calc=${Math.round(atwater)} kcal`
        );
      }
    }

    if (proteins + carbs + fats > 100.5) {
      errors.push(`Soma de macros > 100.5g em "${m.canonicalName}": ${(proteins + carbs + fats).toFixed(1)}g`);
    }
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

  // Processar Fase 2 (TBCA)
  for (const m of PHASE_2_MAPPINGS) {
    const src = tbcaMap.get(m.tbcaCode);
    if (!src) {
      errors.push(`Código TBCA não encontrado no dataset: ${m.tbcaCode} para "${m.canonicalName}"`);
      continue;
    }

    const normName = m.canonicalName.toLowerCase().trim();
    if (seenNames.has(normName)) {
      errors.push(`Nome duplicado na Fase 2: "${m.canonicalName}"`);
    }
    seenNames.add(normName);

    const extId = `tbca-${m.tbcaCode.toLowerCase()}`;
    if (seenIds.has(extId)) {
      errors.push(`ID duplicado na Fase 2: "${extId}"`);
    }
    seenIds.add(extId);

    const calories = Math.round(src.calories);
    const proteins = Math.round(src.proteins * 10) / 10;
    const carbs = Math.round(src.carbs * 10) / 10;
    const fats = Math.round(src.fats * 10) / 10;

    const atwater = 4 * proteins + 4 * carbs + 9 * fats;
    if (calories > 0) {
      const diff = Math.abs(atwater - calories) / calories;
      if (diff > 0.25) {
        atwaterWarnings.push(
          `Divergência Atwater > 25% em "${m.canonicalName}": inf=${calories} kcal vs calc=${Math.round(atwater)} kcal`
        );
      }
    }

    if (proteins + carbs + fats > 100.5) {
      errors.push(`Soma de macros > 100.5g em "${m.canonicalName}": ${(proteins + carbs + fats).toFixed(1)}g`);
    }
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
      source: 'TBCA',
      source_ref: `TBCA v7.2, código ${m.tbcaCode} (${src.sourceName})`,
      external_id: extId,
    });
  }

  // Preservar item oficial do rótulo da Growth
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

  console.log(`\nRelatório de Validação da Curadoria (Fase 1 + Fase 2):`);
  console.log(`- Alimentos da Fase 1 (TACO): ${PHASE_1_MAPPINGS.length}`);
  console.log(`- Alimentos da Fase 2 (TBCA): ${PHASE_2_MAPPINGS.length}`);
  console.log(`- Alimentos de Rótulo: 1`);
  console.log(`- Total Geral Curado: ${outputFoods.length}`);
  console.log(`- Erros críticos: ${errors.length}`);

  if (errors.length > 0) {
    errors.forEach((e) => console.error('  * ERRO:', e));
    process.exit(1);
  }

  console.log(`- Alertas de conferência Atwater: ${atwaterWarnings.length}`);
  atwaterWarnings.forEach((w) => console.warn('  ! AVISO:', w));

  const targetPath = path.join(rootDir, 'data/curated-foods.json');
  fs.writeFileSync(targetPath, JSON.stringify(outputFoods, null, 2), 'utf8');
  console.log(`\n✅ Base curada completa gerada com sucesso em: ${targetPath}`);
}

runBuildPhase2();
