# Ícones de alimentos: estilo e formato

Cada alimento da dieta (e cada substituto) tem UM ícone próprio, desenhado em SVG, que precisa ser
reconhecido de relance quando aparece grande (até 120 px) ou pequeno (28 px) em cima de pratos coloridos.

## Desenho
- `viewBox="0 0 64 64"`. O alimento ocupa uns 52 x 52 px, centralizado, com 6 px de respiro.
- Ilustração chapada (flat), formas arredondadas e generosas, vista de frente ou de 3/4 (a que mais identifica o alimento).
- 2 a 4 cores por ícone, sempre as cores reais do alimento: uma cor base, uma sombra mais escura da mesma cor,
  um brilho/detalhe claro e, se precisar, uma cor de contraste (folha, semente, miolo, casca).
- Contorno: `stroke` de 2 px na sombra da própria cor (NUNCA preto), `stroke-linejoin="round"`, `stroke-linecap="round"`.
  Isso mantém o ícone legível em fundo claro, escuro ou colorido.
- Sem gradientes, filtros, `id`, `class`, `style`, texto, fontes ou imagens externas. Só `<path>`, `<circle>`, `<ellipse>`, `<rect>`, `<g>`, `<polygon>`.
- Itens parecidos precisam ser distinguíveis entre si pela FORMA, não só pela cor (ex.: brie é uma cunha com casca, cottage é uma tigela
  de grumos, mussarela é uma fatia com furinhos, parmesão é um bloco com cristais). Evite emoji genérico: desenhe o que é.
- Alimento preparado aparece como é servido (arroz em tigela/montinho, feijão em concha ou tigela, omelete dobrada, etc.).
- Nunca represente carne, peixe ou frango.

## Formato do arquivo
Cada parte entrega um arquivo `conceitos/icones/<parte>.js` neste formato exato (só o conteúdo interno do SVG, sem a tag `<svg>`):

```js
window.ICONES = window.ICONES || {};
Object.assign(window.ICONES, {
  "Banana": '<path d="..." fill="#FFD84A" stroke="#C99A12" stroke-width="2"/>...',
  "Uva itália": '...'
});
```

- As chaves são EXATAMENTE os nomes de `conceitos/icones/alimentos.json` (acentos e maiúsculas iguais).
- Use aspas simples no JS e aspas duplas dentro do SVG.
- Cada arquivo deve passar em `node --check`.

## Conferência visual (obrigatória)
Gere também `conceitos/icones/previa-<parte>.html`: página simples com uma grade dos seus ícones em 96 px (nome embaixo) e a mesma
grade em 28 px, sobre fundo claro, escuro e colorido. Abra no navegador do app (o servidor local já serve a pasta do projeto
em outro endereço; se precisar, rode `node .claude/serve.js` com `PORT` livre) ou renderize, olhe e corrija o que estiver
irreconhecível, igual a outro ou com a sombra errada. Ícone ruim é pior que ícone simples: prefira forma clara e poucos traços.
