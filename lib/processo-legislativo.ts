// Conteúdo didático da página "Entenda o processo legislativo".
// Fonte: Constituição Federal (arts. 59 a 69) e regimentos da Câmara e do
// Senado. O texto principal é para qualquer pessoa entender; o campo
// `curiosos` traz os números e regras exatas.

export type Cor = 'blue' | 'violet' | 'amber' | 'rose' | 'emerald'

export interface ItemExplicado {
  icone: string
  titulo: string
  texto: string
}

export interface Conceito {
  id: 'pl' | 'plp' | 'pec' | 'mpv'
  sigla: string
  nome: string
  emoji: string
  cor: Cor
  ideia: string // explicação de uma frase
  analogia: string // "é como..."
  quem: ItemExplicado[]
  como: ItemExplicado[]
  ondeComeca: ItemExplicado[]
  atencao?: string
}

export const PROPOSICAO = {
  emoji: '📜',
  nome: 'Proposição',
  ideia: 'É um pedido oficial para criar ou mudar uma regra do país. Todo pedido desses é estudado e votado por deputados e senadores.',
  analogia: 'Pense numa escola: a proposição é o bilhete que alguém entrega dizendo "e se a gente mudasse esta regra?". A turma inteira vai ler, conversar e votar.',
  tipos: 'Existem vários tipos. Os mais importantes são o PL, o PLP, a PEC e a Medida Provisória. Clique em cada um para descobrir quem pode pedir, como e por onde.',
}

export const CONCEITOS: Conceito[] = [
  {
    id: 'pl',
    sigla: 'PL',
    nome: 'Projeto de Lei',
    emoji: '📘',
    cor: 'blue',
    ideia: 'É o jeito mais comum de criar uma lei nova ou mudar uma que já existe.',
    analogia: 'É como propor uma regra nova para a turma, por exemplo "toda sexta tem 10 minutos a mais de recreio".',
    quem: [
      { icone: '🧑‍💼', titulo: 'Deputados e senadores', texto: 'Qualquer um deles, sozinho ou em grupo.' },
      { icone: '👥', titulo: 'Comissões', texto: 'Os grupos de estudo da Câmara, do Senado ou do Congresso.' },
      { icone: '🏛️', titulo: 'Presidente da República', texto: 'Alguns assuntos só ele pode propor, como criar cargos públicos no governo federal.' },
      { icone: '⚖️', titulo: 'STF, tribunais superiores e Procurador-Geral da República', texto: 'Quando o assunto é sobre o próprio funcionamento deles.' },
      { icone: '🙋', titulo: 'Você, cidadão!', texto: 'Juntando assinaturas de 1% dos eleitores do Brasil (cerca de 1,5 milhão de pessoas), de pelo menos 5 estados.' },
    ],
    como: [
      { icone: '✍️', titulo: 'Escrever o texto', texto: 'A ideia vira um texto dividido em artigos, com uma explicação do porquê (a justificativa).' },
      { icone: '📮', titulo: 'Entregar oficialmente', texto: 'O texto é protocolado e ganha um número, como "PL 1234/2026".' },
      { icone: '🗳️', titulo: 'Ganhar a votação nas duas Casas', texto: 'Primeiro em uma Casa (Câmara ou Senado) e depois na outra. Em cada uma, basta ter mais votos "sim" do que "não" entre quem está presente (maioria simples), desde que pelo menos metade da Casa esteja lá.' },
    ],
    ondeComeca: [
      { icone: '🟢', titulo: 'Na Câmara dos Deputados', texto: 'Quando quem propõe é deputado, o Presidente da República, um tribunal, o Procurador-Geral ou os cidadãos.' },
      { icone: '🟣', titulo: 'No Senado Federal', texto: 'Quando quem propõe é senador ou uma comissão do Senado.' },
      { icone: '💻', titulo: 'Pela internet', texto: 'No portal e-Cidadania do Senado, uma ideia com 20 mil apoios em 4 meses vira sugestão e é analisada por uma comissão. Na Câmara, associações e sindicatos podem enviar sugestões à Comissão de Legislação Participativa.' },
    ],
  },
  {
    id: 'plp',
    sigla: 'PLP',
    nome: 'Projeto de Lei Complementar',
    emoji: '📗',
    cor: 'emerald',
    ideia: 'É um projeto de lei para assuntos que a Constituição manda tratar com mais cuidado.',
    analogia: 'É uma regra da turma tão importante que não basta ganhar a votação: precisa do "sim" de mais da metade da turma inteira, até de quem faltou.',
    quem: [
      { icone: '📘', titulo: 'Os mesmos do PL', texto: 'Deputados, senadores, comissões, Presidente, tribunais, Procurador-Geral e cidadãos.' },
    ],
    como: [
      { icone: '📌', titulo: 'Só para temas específicos', texto: 'A Constituição diz quais: por exemplo, regras gerais de impostos e de como o governo pode gastar.' },
      { icone: '🗳️', titulo: 'Maioria absoluta nas duas Casas', texto: 'Precisa de 257 votos "sim" na Câmara e 41 no Senado, não importa quantos estejam presentes.' },
    ],
    ondeComeca: [
      { icone: '🔁', titulo: 'Mesmo caminho do PL', texto: 'Começa na Câmara ou no Senado seguindo as mesmas regras do PL.' },
    ],
  },
  {
    id: 'pec',
    sigla: 'PEC',
    nome: 'Proposta de Emenda à Constituição',
    emoji: '📕',
    cor: 'rose',
    ideia: 'Serve para mudar a Constituição, o livro de regras mais importante do Brasil.',
    analogia: 'É como mudar o regulamento da escola inteira, não só uma regra da turma. Por isso é bem mais difícil.',
    quem: [
      { icone: '🧑‍🤝‍🧑', titulo: 'Um terço dos deputados', texto: 'Pelo menos 171 deputados assinando juntos.' },
      { icone: '🧑‍🤝‍🧑', titulo: 'Um terço dos senadores', texto: 'Pelo menos 27 senadores assinando juntos.' },
      { icone: '🏛️', titulo: 'Presidente da República', texto: 'Pode propor sozinho.' },
      { icone: '🗺️', titulo: 'Assembleias Legislativas', texto: 'Mais da metade das assembleias dos estados, cada uma decidindo por maioria.' },
    ],
    como: [
      { icone: '✍️', titulo: 'Juntar as assinaturas', texto: 'Sem o número mínimo de assinaturas, a PEC nem começa.' },
      { icone: '✌️', titulo: 'Votar duas vezes em cada Casa', texto: 'São dois turnos na Câmara e dois no Senado.' },
      { icone: '🏆', titulo: 'Ganhar com folga', texto: 'Em cada turno, precisa de 3/5: 308 deputados e 49 senadores.' },
    ],
    ondeComeca: [
      { icone: '🟢', titulo: 'Na Câmara', texto: 'Quando vem dos deputados ou do Presidente.' },
      { icone: '🟣', titulo: 'No Senado', texto: 'Quando vem dos senadores.' },
    ],
    atencao: 'Cidadãos não podem propor PEC diretamente. E algumas coisas nunca podem ser tiradas da Constituição (as "cláusulas pétreas"): o voto direto e secreto, a separação dos Poderes, a federação e os direitos individuais.',
  },
  {
    id: 'mpv',
    sigla: 'MP',
    nome: 'Medida Provisória',
    emoji: '📙',
    cor: 'amber',
    ideia: 'É uma regra que o Presidente cria sozinho em caso de urgência e que já começa a valer no mesmo dia.',
    analogia: 'É como o diretor da escola criar uma regra de emergência ("hoje ninguém sai no pátio porque está chovendo"). Ela vale na hora, mas a turma precisa confirmar depois, senão deixa de valer.',
    quem: [
      { icone: '🏛️', titulo: 'Só o Presidente da República', texto: 'Mais ninguém pode editar uma Medida Provisória.' },
    ],
    como: [
      { icone: '🚨', titulo: 'Precisa ser urgente e relevante', texto: 'A Constituição só permite MP para assuntos importantes que não podem esperar.' },
      { icone: '📰', titulo: 'Publicar no Diário Oficial', texto: 'A partir da publicação, já tem força de lei.' },
      { icone: '⏳', titulo: 'Tem prazo de validade', texto: 'Vale por 60 dias, que podem virar 120. Se o Congresso não aprovar nesse tempo, ela "caduca" e perde o efeito.' },
      { icone: '🗳️', titulo: 'Câmara e Senado confirmam', texto: 'As duas Casas votam, cada uma por maioria simples, para a MP virar lei de vez.' },
    ],
    ondeComeca: [
      { icone: '🤝', titulo: 'No Congresso Nacional', texto: 'Primeiro uma comissão mista (deputados e senadores juntos), depois a Câmara e por último o Senado.' },
    ],
    atencao: 'Alguns assuntos não podem ser tratados por MP, como direito penal, eleições, partidos políticos e nacionalidade.',
  },
]

export interface Etapa {
  emoji: string
  titulo: string
  texto: string // para qualquer pessoa entender
  curiosos?: string // detalhe técnico
  onde?: 'camara' | 'senado' | 'congresso' | 'presidencia' | 'autor'
}

export interface Desfecho {
  emoji: string
  titulo: string
  texto: string
  tom: 'bom' | 'medio' | 'ruim'
}

export interface Fluxo {
  id: 'pl' | 'pec' | 'mpv'
  sigla: string
  nome: string
  emoji: string
  cor: Cor
  resumo: string
  etapas: Etapa[]
  desfechos: Desfecho[]
}

export const FLUXOS: Fluxo[] = [
  {
    id: 'pl',
    sigla: 'PL',
    nome: 'Projeto de Lei',
    emoji: '📘',
    cor: 'blue',
    resumo: 'Um PL passa pelas duas Casas do Congresso e depois pelo Presidente da República.',
    etapas: [
      { emoji: '💡', titulo: 'Tem uma ideia', onde: 'autor', texto: 'Alguém percebe um problema e pensa numa regra para resolver.', curiosos: 'O autor escreve o texto em artigos e uma justificativa explicando por que a lei é necessária.' },
      { emoji: '📮', titulo: 'Entrega o projeto', onde: 'camara', texto: 'O projeto é entregue oficialmente e ganha um número, como um RG.', curiosos: 'Começa na Câmara, a não ser que o autor seja senador ou comissão do Senado.' },
      { emoji: '🧭', titulo: 'Escolhe quem vai estudar', onde: 'camara', texto: 'O presidente da Casa decide quais comissões vão estudar o projeto.', curiosos: 'Esse ato se chama despacho. Se o projeto passar por mais de três comissões de mérito na Câmara, cria-se uma comissão especial só para ele.' },
      { emoji: '🔍', titulo: 'Comissões estudam', onde: 'camara', texto: 'Grupos menores de parlamentares estudam o projeto. Um deles, o relator, dá sua opinião, e o grupo vota.', curiosos: 'A comissão do tema avalia se a ideia é boa; a de Finanças vê se há dinheiro; a CCJ confere se respeita a Constituição. Muitos PLs têm "poder conclusivo": a comissão decide sozinha, sem Plenário, a menos que 1/10 dos deputados peça recurso.' },
      { emoji: '🗳️', titulo: 'Plenário vota', onde: 'camara', texto: 'Todos os deputados se reúnem e votam. Ganha quem tiver mais votos.', curiosos: 'Maioria simples, com pelo menos 257 deputados presentes. A votação pode ser simbólica (quem concorda fica como está) ou nominal, no painel eletrônico.' },
      { emoji: '🔁', titulo: 'A outra Casa revisa', onde: 'senado', texto: 'O projeto vai para o Senado, que faz tudo de novo: comissões e votação.', curiosos: 'Se o Senado mudar o texto, ele volta para a Câmara, que só decide se aceita as mudanças. Se o Senado rejeitar, o projeto é arquivado.' },
      { emoji: '✍️', titulo: 'Presidente decide', onde: 'presidencia', texto: 'O Presidente da República lê o projeto e diz "sim" (sanciona) ou "não" (veta).', curiosos: 'Ele tem 15 dias úteis. Pode vetar tudo ou só um pedaço. Se não disser nada, vale como "sim" (sanção tácita).' },
      { emoji: '⚖️', titulo: 'Congresso analisa o veto', onde: 'congresso', texto: 'Se houve veto, deputados e senadores juntos decidem se concordam com o Presidente.', curiosos: 'O veto cai com o voto de 257 deputados e 41 senadores, em sessão conjunta do Congresso.' },
      { emoji: '📰', titulo: 'Vira lei!', onde: 'presidencia', texto: 'A lei ganha um número e é publicada no Diário Oficial para todo mundo conhecer.', curiosos: 'Isso se chama promulgação e publicação. A lei começa a valer na data que ela mesma disser.' },
    ],
    desfechos: [
      { emoji: '🎉', titulo: 'Virou lei', texto: 'Aprovado nas duas Casas e sancionado (ou com o veto derrubado).', tom: 'bom' },
      { emoji: '✂️', titulo: 'Virou lei com cortes', texto: 'O Presidente vetou só uma parte e o Congresso manteve o veto.', tom: 'medio' },
      { emoji: '🗄️', titulo: 'Arquivado', texto: 'Rejeitado em uma das votações, vetado por inteiro ou parado até o fim da legislatura.', tom: 'ruim' },
    ],
  },
  {
    id: 'pec',
    sigla: 'PEC',
    nome: 'Emenda à Constituição',
    emoji: '📕',
    cor: 'rose',
    resumo: 'Uma PEC é votada duas vezes em cada Casa e não passa pelo Presidente.',
    etapas: [
      { emoji: '✍️', titulo: 'Junta assinaturas', onde: 'autor', texto: 'Muita gente precisa concordar só para a PEC começar.', curiosos: '1/3 dos deputados (171) ou dos senadores (27), o Presidente da República ou mais da metade das Assembleias Legislativas.' },
      { emoji: '⚖️', titulo: 'CCJ vê se pode', onde: 'camara', texto: 'A Comissão de Constituição e Justiça confere se a mudança é permitida.', curiosos: 'Isso é a admissibilidade. A PEC não pode acabar com as cláusulas pétreas, nem ser votada durante intervenção federal, estado de defesa ou estado de sítio.' },
      { emoji: '🧩', titulo: 'Comissão especial estuda', onde: 'camara', texto: 'Um grupo criado só para essa PEC estuda o conteúdo e pode melhorar o texto.', curiosos: 'Na Câmara a comissão especial tem prazo de 40 sessões. No Senado, a própria CCJ analisa o conteúdo.' },
      { emoji: '✌️', titulo: 'Câmara vota duas vezes', onde: 'camara', texto: 'Os deputados votam a PEC duas vezes. Nas duas, ela precisa de muitos votos.', curiosos: '3/5 dos deputados (308 votos) em cada turno, com intervalo entre os turnos.' },
      { emoji: '🔁', titulo: 'Senado vota duas vezes', onde: 'senado', texto: 'Os senadores repetem tudo: CCJ e duas votações.', curiosos: '3/5 dos senadores (49 votos) em cada turno. Se uma Casa mudar o texto, a mudança volta para a outra: as duas precisam aprovar exatamente o mesmo texto.' },
      { emoji: '🏛️', titulo: 'Promulgação', onde: 'congresso', texto: 'Câmara e Senado juntos anunciam a mudança. O Presidente da República não participa!', curiosos: 'As Mesas da Câmara e do Senado promulgam em sessão do Congresso, e a PEC vira "Emenda Constitucional nº ...". Não existe sanção nem veto.' },
    ],
    desfechos: [
      { emoji: '🎉', titulo: 'Mudou a Constituição', texto: 'Aprovada nos quatro turnos e promulgada como Emenda Constitucional.', tom: 'bom' },
      { emoji: '🗄️', titulo: 'Rejeitada', texto: 'Se perder uma votação, a mesma PEC só pode voltar no ano legislativo seguinte.', tom: 'ruim' },
    ],
  },
  {
    id: 'mpv',
    sigla: 'MP',
    nome: 'Medida Provisória',
    emoji: '📙',
    cor: 'amber',
    resumo: 'Uma MP já vale desde o primeiro dia, mas o Congresso tem um prazo para confirmar.',
    etapas: [
      { emoji: '🚨', titulo: 'Algo urgente acontece', onde: 'presidencia', texto: 'O Presidente vê um problema importante que não pode esperar.', curiosos: 'A Constituição exige relevância e urgência.' },
      { emoji: '⚡', titulo: 'Já começa a valer', onde: 'presidencia', texto: 'A MP é publicada no Diário Oficial e vale como lei no mesmo dia.', curiosos: 'Vale por 60 dias, prorrogáveis por mais 60. O relógio para durante as férias do Congresso (recesso).' },
      { emoji: '🤝', titulo: 'Comissão mista', onde: 'congresso', texto: 'Deputados e senadores juntos estudam a MP e dão sua opinião.', curiosos: 'Os parlamentares têm até 6 dias para sugerir mudanças (emendas). A comissão aprova um parecer.' },
      { emoji: '⏰', titulo: 'O relógio aperta', onde: 'congresso', texto: 'Se ninguém votar em 45 dias, a MP "tranca a pauta": quase nada mais pode ser votado até ela.', curiosos: 'É o regime de urgência: as outras deliberações da Casa onde a MP está ficam paradas.' },
      { emoji: '🗳️', titulo: 'Câmara vota', onde: 'camara', texto: 'Os deputados votam a MP.', curiosos: 'Maioria simples. Se mudarem o texto, ele vira um Projeto de Lei de Conversão (PLV).' },
      { emoji: '🔁', titulo: 'Senado vota', onde: 'senado', texto: 'Depois os senadores votam.', curiosos: 'Maioria simples. Se o Senado mudar o texto, as mudanças voltam para a Câmara.' },
    ],
    desfechos: [
      { emoji: '🎉', titulo: 'Virou lei', texto: 'Aprovada sem mudanças: é promulgada. Com mudanças (PLV): vai para sanção ou veto do Presidente.', tom: 'bom' },
      { emoji: '⌛', titulo: 'Caducou', texto: 'Passaram os 120 dias sem votação: perde o efeito, e o Congresso regula o que aconteceu enquanto ela valeu.', tom: 'medio' },
      { emoji: '🗄️', titulo: 'Rejeitada', texto: 'Perde o efeito, e o Presidente não pode editar a mesma MP de novo no mesmo ano legislativo.', tom: 'ruim' },
    ],
  },
]

// ---------- Quantos votos precisa? ----------
export interface Quorum {
  nome: string
  emoji: string
  explicacao: string
  camara: string // votos na Câmara (513 deputados)
  senado: string // votos no Senado (81 senadores)
  fracao: number // parte da Casa que precisa votar "sim" (para a barrinha)
  usadoEm: string[]
}

export const QUORUNS: Quorum[] = [
  {
    nome: 'Maioria simples',
    emoji: '✋',
    explicacao: 'Ganha quem tiver mais votos entre as pessoas presentes. Mas a votação só vale se pelo menos metade da Casa estiver lá.',
    camara: 'mais "sim" que "não", com pelo menos 257 presentes',
    senado: 'mais "sim" que "não", com pelo menos 41 presentes',
    fracao: 0.26,
    usadoEm: ['Projeto de Lei (PL)', 'Medida Provisória', 'A maioria das votações do dia a dia'],
  },
  {
    nome: 'Maioria absoluta',
    emoji: '🖐️',
    explicacao: 'Precisa do "sim" de mais da metade de TODOS os membros, mesmo de quem faltou. Faltar conta como não ajudar.',
    camara: '257 de 513',
    senado: '41 de 81',
    fracao: 0.5,
    usadoEm: ['Projeto de Lei Complementar (PLP)', 'Derrubar um veto do Presidente', 'Cassar o mandato de um parlamentar'],
  },
  {
    nome: 'Três quintos (3/5)',
    emoji: '🏅',
    explicacao: 'Precisa de 3 em cada 5 membros dizendo "sim". É para mudanças muito importantes.',
    camara: '308 de 513',
    senado: '49 de 81',
    fracao: 0.6,
    usadoEm: ['Proposta de Emenda à Constituição (PEC), em cada um dos dois turnos'],
  },
  {
    nome: 'Dois terços (2/3)',
    emoji: '🏆',
    explicacao: 'Precisa de 2 em cada 3 membros. É o mais difícil de todos, usado para decisões gravíssimas.',
    camara: '342 de 513',
    senado: '54 de 81',
    fracao: 0.667,
    usadoEm: ['Câmara: autorizar o processo de impeachment do Presidente', 'Senado: condenar o Presidente no impeachment'],
  },
]

// ---------- Quem são e o que fazem ----------
export interface Parlamentar {
  id: 'federal' | 'estadual' | 'senador'
  pergunta: string
  emoji: string
  cor: Cor
  resumo: string
  numeros: { rotulo: string; valor: string }[]
  fazem: ItemExplicado[]
  ferramentas: ItemExplicado[]
}

export const PARLAMENTARES: Parlamentar[] = [
  {
    id: 'federal',
    pergunta: 'O que um deputado federal faz?',
    emoji: '🟢',
    cor: 'blue',
    resumo: 'Representa o povo de todo o Brasil na Câmara dos Deputados, em Brasília. É como o representante de turma, só que da turma do país inteiro.',
    numeros: [
      { rotulo: 'Quantos são', valor: '513 (cada estado tem de 8 a 70, conforme a população)' },
      { rotulo: 'Mandato', valor: '4 anos' },
      { rotulo: 'Onde trabalha', valor: 'Câmara dos Deputados, em Brasília' },
    ],
    fazem: [
      { icone: '📘', titulo: 'Cria e vota leis para o país', texto: 'Leis que valem em todo o Brasil, como regras de trânsito, do consumidor e de trabalho.' },
      { icone: '🔦', titulo: 'Fiscaliza o governo federal', texto: 'Pode chamar ministros para explicar decisões, pedir informações e abrir CPIs para investigar.' },
      { icone: '💰', titulo: 'Decide o Orçamento da União', texto: 'Junto com os senadores, aprova quanto dinheiro o governo federal pode gastar e em quê.' },
      { icone: '⚖️', titulo: 'Autoriza o impeachment', texto: 'É a Câmara que decide se um processo contra o Presidente pode começar (precisa de 342 votos).' },
    ],
    ferramentas: [
      { icone: '✍️', titulo: 'Poder de propor leis', texto: 'Pode apresentar PL e PLP sozinho, e PEC junto com pelo menos 171 colegas.' },
      { icone: '🎁', titulo: 'Emendas parlamentares', texto: 'Pode indicar uma parte do Orçamento federal para obras e serviços, como um posto de saúde na sua cidade. Metade das emendas individuais vai para a saúde, e o governo é obrigado a pagar.' },
      { icone: '🔎', titulo: 'CPI', texto: 'Com 171 assinaturas, cria uma Comissão Parlamentar de Inquérito, que investiga com poderes parecidos com os de um juiz.' },
      { icone: '🛡️', titulo: 'Imunidade parlamentar', texto: 'Não pode ser processado pelo que fala e vota no exercício do mandato. Crimes comuns são julgados pelo STF.' },
      { icone: '🗂️', titulo: 'Gabinete e verbas', texto: 'Tem assessores e uma verba para despesas do mandato, como viagens e escritório, com prestação de contas pública.' },
    ],
  },
  {
    id: 'estadual',
    pergunta: 'O que um deputado estadual ou distrital faz?',
    emoji: '🟠',
    cor: 'amber',
    resumo: 'Faz o mesmo trabalho de um deputado federal, mas para um estado só. No Distrito Federal ele se chama deputado distrital.',
    numeros: [
      { rotulo: 'Quantos são', valor: 'Depende do estado: de 24 a 94 (o DF tem 24 distritais)' },
      { rotulo: 'Mandato', valor: '4 anos' },
      { rotulo: 'Onde trabalha', valor: 'Assembleia Legislativa, na capital do estado (no DF, Câmara Legislativa)' },
    ],
    fazem: [
      { icone: '📗', titulo: 'Cria e vota leis do estado', texto: 'Leis que valem só no estado, por exemplo sobre escolas estaduais, polícia e alguns impostos, como o ICMS.' },
      { icone: '🔦', titulo: 'Fiscaliza o governador', texto: 'Acompanha o que o governo do estado faz com o dinheiro e pode abrir CPIs estaduais.' },
      { icone: '💰', titulo: 'Decide o Orçamento do estado', texto: 'Aprova quanto o governo do estado pode gastar e em quê.' },
      { icone: '🏙️', titulo: 'No DF, cuida também da cidade', texto: 'Como o DF não tem municípios, o distrital faz o papel de deputado estadual e de vereador.' },
    ],
    ferramentas: [
      { icone: '✍️', titulo: 'Poder de propor leis estaduais', texto: 'Apresenta projetos na Assembleia e pode propor mudanças na Constituição do estado.' },
      { icone: '🎁', titulo: 'Emendas ao orçamento do estado', texto: 'Na maioria dos estados também pode indicar parte do orçamento estadual para obras e serviços.' },
      { icone: '🔎', titulo: 'CPI estadual', texto: 'Investiga assuntos do governo do estado.' },
      { icone: '🛡️', titulo: 'Imunidade parlamentar', texto: 'Tem as mesmas proteções dos deputados federais pelo que fala e vota.' },
      { icone: '🤝', titulo: 'Força em grupo', texto: 'Se mais da metade das Assembleias do país concordarem, elas podem propor uma PEC no Congresso.' },
    ],
  },
  {
    id: 'senador',
    pergunta: 'O que um senador faz?',
    emoji: '🟣',
    cor: 'violet',
    resumo: 'Representa o seu estado no Senado Federal. Todo estado tem o mesmo número de senadores, seja grande ou pequeno.',
    numeros: [
      { rotulo: 'Quantos são', valor: '81 (3 por estado e 3 pelo DF)' },
      { rotulo: 'Mandato', valor: '8 anos (a cada 4 anos, renova-se 1/3 ou 2/3 do Senado)' },
      { rotulo: 'Onde trabalha', valor: 'Senado Federal, em Brasília' },
    ],
    fazem: [
      { icone: '📘', titulo: 'Cria e revisa leis', texto: 'Propõe leis e revisa as que vêm da Câmara. Uma lei federal só existe se as duas Casas aprovarem.' },
      { icone: '🧑‍⚖️', titulo: 'Aprova nomes importantes', texto: 'Entrevista e aprova (ou não) ministros do STF, o Procurador-Geral da República, a diretoria do Banco Central e embaixadores.' },
      { icone: '⚖️', titulo: 'Julga o impeachment', texto: 'Depois que a Câmara autoriza, é o Senado que julga o Presidente (precisa de 54 votos para condenar).' },
      { icone: '🏦', titulo: 'Controla as dívidas', texto: 'Autoriza empréstimos de estados e municípios com o exterior e define limites para as dívidas públicas.' },
    ],
    ferramentas: [
      { icone: '✍️', titulo: 'Poder de propor leis', texto: 'Pode apresentar PL e PLP sozinho, e PEC junto com pelo menos 27 colegas.' },
      { icone: '🎁', titulo: 'Emendas parlamentares', texto: 'Assim como os deputados, indica parte do Orçamento federal para obras e serviços no seu estado.' },
      { icone: '🔎', titulo: 'CPI', texto: 'Com 27 assinaturas, cria uma CPI no Senado.' },
      { icone: '🛡️', titulo: 'Imunidade parlamentar', texto: 'Mesmas proteções dos deputados federais.' },
      { icone: '👥', titulo: 'Suplentes', texto: 'Cada senador é eleito com dois suplentes, que assumem se o titular sair do cargo.' },
    ],
  },
]

export const DIFERENCAS: { aspecto: string; federal: string; estadual: string }[] = [
  { aspecto: 'Para quem faz leis', federal: 'Para o Brasil inteiro', estadual: 'Só para o seu estado (ou para o DF)' },
  { aspecto: 'Onde trabalha', federal: 'Câmara dos Deputados, em Brasília', estadual: 'Assembleia Legislativa do estado' },
  { aspecto: 'Quem fiscaliza', federal: 'O Presidente e os ministros', estadual: 'O governador e os secretários' },
  { aspecto: 'Que orçamento decide', federal: 'O da União', estadual: 'O do estado' },
  { aspecto: 'Exemplo de lei', federal: 'Código de Trânsito, que vale em todo o país', estadual: 'Regras das escolas e da polícia do estado' },
]
