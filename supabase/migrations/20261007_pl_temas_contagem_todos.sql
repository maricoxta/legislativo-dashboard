-- O card de cada tema passa a contar todo PL que tem o tema em qualquer
-- posição de `temas`, não só como tema principal, para bater com a página
-- do tema. Um PL com vários temas entra em vários cards.
create or replace view pl_temas_contagem as
  select casa, ano, t.tema, origem, count(*)::int as total
  from pl_temas, unnest(temas) as t(tema)
  group by casa, ano, t.tema, origem;
