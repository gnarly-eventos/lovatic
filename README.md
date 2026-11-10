# Lovatic Experience · Ingressos

Página de ingressos (link na bio do @lovaticparty): https://lovatic.gnarlyeventos.com.br/

- `eventos.json`: gerado sozinho pelo robô (de hora em hora) a partir das duas contas do Sympla (nomes com "Lovatic"). Não editar.
- `ajustes.json`: editar à mão para marcar `"selo": "esgotado"` ou `"ultimos"`, trocar o `"titulo"` ou `"ocultar": true` um evento (pelo id, ex.: `s37af86`).
- Para atualizar na hora: aba Actions → "Publicar página" → Run workflow.
- Os tokens do Sympla ficam em Settings → Secrets → `SYMPLA_TOKEN_1` e `SYMPLA_TOKEN_2`. Nunca colocar token nos arquivos.
