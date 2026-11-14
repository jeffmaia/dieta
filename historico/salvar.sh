#!/bin/sh
# Uso: historico/salvar.sh v4-nome-curto "Descrição em uma linha"
# Copia conceitos/ para historico/<versão>/ (abre no navegador como estava),
# registra na linha do tempo do histórico e grava um commit com tag no git.
set -e
cd "$(dirname "$0")/.."
V="$1"; DESC="$2"
[ -n "$V" ] && [ -n "$DESC" ] || { echo "uso: historico/salvar.sh <versao> \"descricao\""; exit 1; }
[ -e "historico/$V" ] && { echo "historico/$V já existe"; exit 1; }
mkdir -p "historico/$V"
cp -R conceitos/. "historico/$V/"
rm -f "historico/$V/.DS_Store"
printf -- "- **%s** (%s): %s — [abrir](%s/index.html)\n" "$V" "$(date '+%Y-%m-%d %H:%M')" "$DESC" "$V" >> historico/README.md
git add conceitos historico .claude/serve.js .claude/serve-lan.js .claude/launch.json design
git commit -q -m "$V: $DESC

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git tag "$V"
echo "salvo: historico/$V  (git tag $V)"
