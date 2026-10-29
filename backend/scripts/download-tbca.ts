import fs from 'fs';
import path from 'path';

export interface TbcaItem {
  code: string;
  sourceName: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

export const TBCA_PHASE_2_CODES = [
  // 1. REFEIÇÕES E PRATOS TRADICIONAIS BRASILEIROS
  'BRC0198T', // Feijoada, c/ sal
  'BRC0172T', // Feijoada vegetariana, c/ sal, Brasil
  'BRC0364E', // Feijoada de frutos do mar
  'BRC0004S', // Refeição composta por 50 g de arroz polido e 50 g de feijão carioca, c/ sal, Brasil
  'BRC0188A', // Baião de dois, arroz e feijão fradinho (de corda), c/ sal
  'BRC0911F', // Estrogonofe (strogonoff) de frango, c/ sal
  'BRC0910F', // Estrogonofe (strogonoff) de carne, c/ sal
  'BRC0372E', // Estrogonofe (strogonoff) de camarão, c/ sal, Brasil
  'BRC0761B', // Escondidinho, c/ charque (carne seca, carne de sol, jaba) , c/ sal
  'BRC0762B', // Escondidinho de frango, c/ sal
  'BRC0253E', // Moqueca de camarão, c/ leite de coco, c/ azeite de dendê, c/ sal, Brasil
  'BRC0255E', // Moqueca de frutos do mar, c/ sal
  'BRC0892A', // Vatapá, c/ sal
  'BRC0203T', // Acarajé, c/ sal
  'BRC0293F', // Bife à parmegiana, c/ sal
  'BRC0978F', // Carne, peito de frango, grelhado, à pizzaiolo
  'BRC0001S', // Refeição composta por 80g arroz polido, 60g feijão carioca, 60g carne bovina refogada e 60g quibebe, c/ óleo de soja, c/ sal, Brasil
  'BRC0002S', // Refeição composta por 80g arroz polido, 60g feijão carioca e 60g batata inlgesa sauté, c/ óleo de soja, c/ sal, Brasil
  'BRC0726F', // Hambúrguer*, bovino, grelhado, c/ molho de tomate, c/ sal, Brasil
  'BRC0740B', // Sopa, mandioca (aipim, macaxeira), c/ sal
  'BRC0623A', // Risoto de legumes, c/ arroz polido, c/ sal, Brasil
  'BRC0625A', // Risoto de camarão, c/ arroz polido, c/ sal
  'BRC0624A', // Risoto de frutos do mar, c/ arroz polido, c/ sal
  'BRC0673A', // Polenta, c/ molho à bolonhesa (carne bovina - patinho moído, tomate, cebola, alho, c/ óleo), c/ sal
  'BRC0143A', // Milho, polenta/fubá, cozido, c/ sal
  'BRC0959B', // Quibebe, carne seca (carne de sol, jaba) dessalgada, c/ sal, Brasil
  'BRC1204B', // Quibebe, c/ sal, Brasil
  'BRC0299E', // Cestinha de frutos do mar, c/ massa de pastel frita, c/ sal

  // 2. MASSAS, TORTAS E PANQUECAS
  'BRC0395A', // Lasanha, bolonhesa, artesanal, assada, Brasil
  'BRC0113A', // Lasanha, quatro queijos, congelada, Brasil
  'BRC0558A', // Lasanha, peito de frango, caseira
  'BRC0894A', // Lasanha, queijos, c/ molho branco, c/ sal, caseira
  'BRC0684B', // Lasanha, berinjela, c/ molho bolonhesa, caseira, c/ sal
  'BRC1025B', // Lasanha, abobrinha, c/ molho bolonhesa, caseira, c/ sal
  'BRC0576A', // Lasanha, legumes
  'BRC0238A', // Macarrão, c/ molho bolonhesa, c/ sal
  'BRC0214A', // Macarrão, trigo, c/ ovos, c/ alho e óleo, c/ sal
  'BRC0220A', // Macarrão, trigo, c/ ovos, c/ molho branco (leite, manteiga e farinha de trigo), c/ sal
  'BRC0613A', // Macarrão, trigo, c/ molho de tomate, c/ peito de frango, c/ óleo, cebola e alho, c/ sal
  'BRC0853A', // Macarrão, trigo, c/ linguiça calabresa, salsa, cebolinha, c/ molho de tomate, c/ sal
  'BRC0600A', // Macarrão, trigo, c/ presunto, ervilha, queijo parmesão, c/ molho branco, c/ sal
  'BRC0235A', // Macarrão, trigo, integral, c/ molho de tomate, c/ sal
  'BRC0239A', // Macarrão, trigo, integral, à bolonhesa, c/ sal
  'BRC0464B', // Nhoque de batata, c/ molho de tomate, c/ sal
  'BRC0920B', // Nhoque (batata, ovo, margarina e farinha de trigo), cozido, s/ molho, c/ sal
  'BRC0814A', // Panqueca, c/ recheio de carne moída, s/ molho,  c/ sal
  'BRC0585A', // Panqueca, c/ peito de frango refogado, s/ molho, caseira, c/ sal
  'BRC0582A', // Panqueca, c/ ricota e espinafre, c/ molho de tomate, caseiro, c/ sal
  'BRC0751A', // Empadão, frango, c/ sal
  'BRC0652A', // Quiche, alho-poró, assado, c/ sal
  'BRC1108A', // Quiche, queijo, assado
  'BRC0653A', // Quiche, espinafre, assado, c/ sal

  // 3. CALDOS E SOPAS
  'BRC0681B', // Caldo verde, c/ sal
  'BRC0891B', // Sopa, canja, c/ legumes, c/ arroz polido, c/ peito de frango, c/ sal
  'BRC1058A', // Sopa, carne bovina, c/ macarrão, c/ vegetais, c/ sal
  'BRC0734B', // Sopa, vegetais, c/ sal
  'BRC1054A', // Sopa, macarrão, c/ vegetais, c/ sal
  'BRC0666A', // Sopa, milho, fubá, c/ couve, c/ linguiça calabresa, c/ sal
  'BRC0125B', // Sopa, creme, ervilha, industrializada, congelada, preparada, Brasil
  'BRC0833A', // Sopa, creme de cebola, desidratada (preparada conforme a embalagem)
  'BRC0143B', // Sopa, batata inglesa, c/ sal

  // 4. SALGADOS DE BOTECO E PADARIA
  'BRC0100F', // Coxinha de frango, industrializada, frita
  'BRC0166A', // Pastel, c/ recheio de carne bovina, frito, artesanal, Brasil
  'BRC0167A', // Pastel, c/ recheio de queijo, frito, artesanal, Brasil
  'BRC0741A', // Pastel de forno, recheado c/ carne bovina, assado, Brasil
  'BRC0740A', // Pastel de forno, recheado c/ queijo, assado
  'BRC0744A', // Pastel de forno, recheado c/ frango e requeijão, assado
  'BRC0743A', // Pastel de forno, recheado c/ palmito e requeijão, assado
  'BRC1064A', // Pastel, c/ recheio de frango, queijo e milho, frito, caseiro
  'BRC0422A', // Esfirra, carne, caseira, assada
  'BRC0424A', // Esfirra, frango, caseira, assada
  'BRC0423A', // Esfirra, ricota, caseira, assada
  'BRC0953A', // Esfirra, creme de queijo (tipo catupiry), caseira, assada
  'BRC1146A', // Esfirra, muçarela, caseira, assada
  'BRC0443A', // Empada, c/ peito de frango refogado, assada, c/ sal
  'BRC0444A', // Empada, queijo minas, caseira, assada
  'BRC0445A', // Empada, carne, caseira, assada
  'BRC0446A', // Empada, camarão, caseira, assada
  'BRC0877F', // Quibe, bovino, frito, c/sal
  'BRC0830F', // Quibe, bovino, assado
  'BRC0921F', // Quibe, bovino, cru, c/ sal
  'BRC1079B', // Quibe com abóbora cabotian (japonesa), assado, c/ sal
  'BRC0245T', // Quibe vegetariano com lentilha, assado, c/ sal
  'BRC0476F', // Croquete, carne, caseiro, frito (c/ óleo de soja)
  'BRC0440A', // Risole, recheado c/ queijo muçarela, caseiro, frito
  'BRC0441A', // Risole, recheado c/ carne, caseiro, frito
  'BRC0442A', // Risole, recheado c/ camarão, caseiro, frito
  'BRC0474F', // Carne, frango, empanado, tipo nuggets, congelado, frito (c/ óleo de soja), Brasil
  'BRC0825A', // Croissant, assado, c/ recheio, de brigadeiro

  // 5. SANDUÍCHES E FAST FOOD
  'BRC0262A', // Sanduíche, misto quente, pão forma tradicional*, c/ presunto cozido*, queijo muçarela* e manteiga*, Brasil
  'BRC0260A', // Sanduíche, misto quente, pão forma tradicional*, c/ presunto cozido*, queijo muçarela* e maionese, Brasil
  'BRC0261A', // Sanduíche, misto quente, pão forma integral*, c/ presunto cozido* e queijo muçarela*, Brasil
  'BRC0412A', // Sanduíche, ´Bauru´, Brasil
  'BRC0244A', // Sanduíche, hambúrguer bovino* grelhado, c/ catchup*, molho de mostarda* e maionese, Brasil
  'BRC0248A', // Sanduíche, cheeseburguer, hambúrguer bovino* grelhado, c/ queijo prato*, Brasil
  'BRC0252A', // Sanduíche, cheese salad, hambúrguer bovino* grelhado, c/ queijo prato*, maionese, tomate e alface, Brasil
  'BRC0291A', // Sanduíche, hambúrguer bovino* grelhado,  c/ ovo frito (c/ sal), Brasil
  'BRC0293A', // Sanduíche, hambúrguer bovino* grelhado, c/ ovo frito*, tomate e alface crespa, Brasil
  'BRC0247A', // Sanduíche, hambúrguer bovino* grelhado, c/ queijo prato*, catchup*, cebola e picles, Brasil
  'BRC0919F', // Hambúrguer, industrializado, frango, grelhado, s/ óleo
  'BRC0244T', // Hambúrguer de grão de bico, grelhado, c/ azeite de oliva, c/ sal
  'BRC0207T', // Hambúrguer de soja, grelhado, c/ óleo de soja, c/ sal
  'BRC0240A', // Sanduíche, cachorro quente, c/ catchup*, molho de mostarda* e maionese, Brasil
  'BRC0241A', // Sanduíche, cachorro quente completo prensado c/ purê de batata, batata palha, milho, Brasil
  'BRC0242A', // Sanduíche, cachorro quente c/ molho de tomate, milho, ervilha e batata palha, Brasil
  'BRC1105F', // Sanduíche, wrap de frango, s/ óleo, c/ sal, Brasil
  'BRC0438A', // Crepe, c/ presunto, c/ queijo muçarela
  'BRC0001M', // Sanduíche, Big Mac, McDonald´s (dado importado)
  'BRC0007M', // Sanduíche, Cheeseburguer, McDonald´s (dado importado)
  'BRC0009M', // Sanduíche, Whopper, c/ queijo, Burguer King (dado importado)
  'BRC0006M', // Batata frita, McDonald´s (dado importado)
  'BRC0012M', // Tiras de frango crocante, frito, KFC (dado importado)

  // 6. PIZZAS (FATIAS)
  'BRC0225A', // Pizza, queijo muçarela, artesanal, assada, Brasil
  'BRC0425A', // Pizza, linguiça calabresa, caseira
  'BRC0678A', // Pizza, frango com requeijão, caseira
  'BRC0682A', // Pizza, 4 queijos, caseira
  'BRC0427A', // Pizza, portuguesa, assada
  'BRC0685A', // Pizza, Marguerita, c/ queijo muçarela* e manjericão, artesanal, Brasil
  'BRC0676A', // Pizza, lombo canadense, caseira
  'BRC0677A', // Pizza, c/ atum*, c/ queijo muçarela*, artesanal, Brasil
  'BRC0686A', // Pizza, pepperoni, caseira
  'BRC0679A', // Pizza, rúcula ,c/ tomate seco e muçarela de búfula, caseira
  'BRC0875A', // Pizza, palmito e requeijão
  'BRC0687A', // Pizza, vegetariana, caseira
  'BRC0689A', // Pizza, doce, brigadeiro c/ morango, caseira
  'BRC0691A', // Pizza, doce, banana, c/ leite condensado, caseira

  // 7. TAPIOCAS, CUSCUZ E PRATOS TÍPICOS REGIONAIS
  'BRC0137B', // Tapioca, c/ manteiga, c/ sal
  'BRC0840B', // Tapioca, c/ charque* (carne seca, jaba) e queijo coalho*, Brasil
  'BRC0839B', // Tapioca*, c/ leite condensado** e coco, Brasil
  'BRC0191A', // Cuscuz paulista, s/ sal
  'BRC0997B', // Cuscuz de tapioca, c/ coco e leite de coco
  'BRC1042B', // Cuscuz de tapioca, c/ legumes, c/ sal
  'BRC1050A', // Pamonha, milho verde, c/ queijo muçarela
  'BRC1051A', // Pamonha, milho verde, c/ coco ralado, c/ açúcar
  'BRC0184A', // Canjica, milho, branca, cozida, c/ leite integral e açúcar
  'BRC0140A', // Milho, curau, cozido
  'BRC0914A', // Arroz doce, c/ leite condensado e canela
  'BRC0913A', // Arroz doce, c/ açúcar e canela
  'BRC0826B', // Tabule, c/ trigo para quibe, c/ sal, Brasil

  // 8. BOLOS E TORTAS DOCES
  'BRC0197A', // Bolo, farinha de trigo refinada, sem recheio, artesanal, Brasil
  'BRC0226A', // Bolo, fubá, sem recheio, artesanal, Brasil
  'BRC0822A', // Bolo, cenoura, c/ cobertura de chocolate, caseiro
  'BRC0821A', // Bolo, cenoura, c/ recheio de brigadeiro, c/ cobertura de chocolate, caseiro
  'BRC0823A', // Bolo, chocolate, c/ recheio de brigadeiro, c/ cobertura de chocolate, caseiro
  'BRC0227A', // Bolo, coco, sem recheio, artesanal, Brasil
  'BRC0067A', // Bolo, laranja, mistura p/, preparado, Brasil
  'BRC0080A', // Bolo, milho, mistura p/, preparado, Brasil
  'BRC0077A', // Bolo, mandioca (aipim, macaxeira), mistura p/,  preparado, Brasil
  'BRC0829A', // Bolo, abacaxi, caseiro
  'BRC0075A', // Bolo, páscoa, c/ gotas de chocolate, Brasil
  'BRC0034K', // Torta, mousse, chocolate, c/ raspas de chocolate, Brasil
  'BRC0035K', // Torta, mousse, limão, Brasil
  'BRC0036K', // Torta, mousse, maracujá, Brasil

  // 9. DOCES TRADICIONAIS E SOBREMESAS
  'BRC0190K', // Brigadeiro, c/ chocolate ao leite, artesanal, Brasil
  'BRC0191K', // Beijinho, c/ coco ralado, caseiro
  'BRC0227K', // Pudim de leite, artesanal, Brasil
  'BRC0122G', // Pudim de pão, c/ calda, Brasil
  'BRC0063K', // Mousse, chocolate, mistura p/, preparada, Brasil
  'BRC0065K', // Mousse, maracujá, mistura p/, preparada, Brasil
  'BRC0064K', // Mousse, limão, mistura p/, preparada, Brasil
  'BRC0012K', // Cocada, branca
  'BRC0031K', // Quindim, artesanal, Brasil
  'BRC0918A', // Churros, frito, c/ recheio de brigadeiro, c/ açúcar polvilhado
  'BRC0920A', // Churros, frito, c/ recheio de brigadeiro, s/ açúcar polvilhado
  'BRC1053A', // Sonho, assado, c/ recheio de brigadeiro, c/ cobertura de chocolate
  'BRC0917A', // Pão de mel, c/ recheio de brigadeiro, c/ cobertura
  'BRC0192K', // Bomba, c/ recheio de brigadeiro, c/ cobertura de chocolate
  'BRC0147K', // Canudinho, c/ recheio de brigadeiro
  'BRC0121K', // Petit gateau, sorvete, c/ calda de chocolate
  'BRC0095C', // Açaí, polpa, com xarope de guaraná e glucose, Brasil

  // 10. SOBREMESAS GELADAS E SORVETES
  'BRC0141K', // Sorvete, industrializado (dado importado)
  'BRC0099K', // Sorvete, sundae
  'BRC0193K', // Sorvete, na casquinha, industrializado
  'BRC0144H', // Milk shake (leite integral, sorvete, extrato de baunilha e calda de chocolate)
  'BRC0437A'  // Crepe, c/ recheio de banana e chocolate ao leite*, s/ açúcar, Brasil
];

function parseNum(val: string): number {
  if (!val) return 0;
  const clean = val.trim().replace(',', '.');
  if (['tr', 'tr.', 'traço', 'na', '*', '-', ''].includes(clean.toLowerCase())) return 0;
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

async function fetchTbcaNutrients(code: string): Promise<TbcaItem | null> {
  const searchParams = new URLSearchParams({ guarda: 'tomo1', produto: code });
  const searchRes = await fetch('https://www.tbca.net.br/base-dados/composicao_alimentos.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: searchParams.toString(),
  });
  const searchHtml = await searchRes.text();
  const tableMatch = searchHtml.match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) return null;

  const rows = tableMatch[0].match(/<tr[\s\S]*?<\/tr>/gi);
  if (!rows || rows.length <= 1) return null;

  let targetRow = rows[1];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].includes(`>${code}<`)) {
      targetRow = rows[i];
      break;
    }
  }

  const linkMatch = targetRow.match(/href='([^']+)'/);
  if (!linkMatch) return null;

  const cols = Array.from(targetRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((m) =>
    m[1].replace(/<[^>]+>/g, '').trim()
  );
  const sourceName = cols[1] || '';

  const detailUrl = `https://www.tbca.net.br/base-dados/${linkMatch[1]}`;
  const detailRes = await fetch(detailUrl);
  const detailHtml = await detailRes.text();
  const detailTableMatch = detailHtml.match(/<table[\s\S]*?<\/table>/i);
  if (!detailTableMatch) return null;

  const detailRows = detailTableMatch[0].match(/<tr[\s\S]*?<\/tr>/gi);
  if (!detailRows) return null;

  let calories = 0;
  let proteins = 0;
  let carbs = 0;
  let fats = 0;

  for (let i = 1; i < detailRows.length; i++) {
    const rCols = Array.from(detailRows[i].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim()
    );
    if (rCols.length < 3) continue;

    const comp = rCols[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const unit = rCols[1].toLowerCase();
    const val = parseNum(rCols[2]);

    if (comp === 'energia' && unit === 'kcal') {
      calories = val;
    } else if (comp === 'proteina' && unit === 'g') {
      proteins = val;
    } else if (comp === 'carboidrato disponivel' && unit === 'g') {
      carbs = val;
    } else if (comp === 'carboidrato total' && unit === 'g' && carbs === 0) {
      carbs = val;
    } else if (comp.includes('lipidio') && unit === 'g') {
      fats = val;
    }
  }

  return {
    code,
    sourceName,
    calories: Math.round(calories),
    proteins: Math.round(proteins * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fats: Math.round(fats * 10) / 10,
  };
}

async function runDownload() {
  const rootDir = process.cwd().endsWith('backend') ? process.cwd() : path.join(process.cwd(), 'backend');
  const targetPath = path.join(rootDir, 'data/tbca-foods.json');

  let existingFoods: Record<string, TbcaItem> = {};
  if (fs.existsSync(targetPath)) {
    try {
      const parsed: TbcaItem[] = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      parsed.forEach((item) => {
        existingFoods[item.code] = item;
      });
      console.log(`Carregados ${Object.keys(existingFoods).length} itens existentes em cache de ${targetPath}`);
    } catch {
      existingFoods = {};
    }
  }

  const uniqueCodes = Array.from(new Set(TBCA_PHASE_2_CODES));
  console.log(`Iniciando download de ${uniqueCodes.length} alimentos da TBCA...`);

  let fetchedCount = 0;
  for (let i = 0; i < uniqueCodes.length; i++) {
    const code = uniqueCodes[i];
    if (existingFoods[code] && existingFoods[code].calories > 0) {
      continue;
    }

    process.stdout.write(`[${i + 1}/${uniqueCodes.length}] Baixando ${code}... `);
    const item = await fetchTbcaNutrients(code);
    if (item) {
      existingFoods[code] = item;
      console.log(`OK: "${item.sourceName.slice(0, 40)}" (${item.calories} kcal)`);
      fetchedCount++;
    } else {
      console.error(`FALHA ao obter dados para ${code}`);
    }

    // Pausa breve para respeitar o servidor
    await new Promise((r) => setTimeout(r, 200));

    // Salva periodicamente a cada 10 itens
    if (fetchedCount > 0 && fetchedCount % 10 === 0) {
      fs.writeFileSync(targetPath, JSON.stringify(Object.values(existingFoods), null, 2), 'utf8');
    }
  }

  fs.writeFileSync(targetPath, JSON.stringify(Object.values(existingFoods), null, 2), 'utf8');
  console.log(`\n✅ Download concluído! ${Object.keys(existingFoods).length} alimentos salvos em ${targetPath}`);
}

runDownload();
