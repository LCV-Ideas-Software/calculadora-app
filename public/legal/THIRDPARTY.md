# Third-Party Components

Este inventário cobre todas as dependências diretas declaradas em `package.json`,
inclusive a licença aplicada quando o pacote oferece alternativas. As versões
exatas e as dependências transitivas permanecem registradas no
[`package-lock.json`](https://github.com/LCV-Ideas-Software/calculadora-app/blob/main/package-lock.json).
Cada build de produção também publica `/legal/THIRD-PARTY-NOTICES.json`, gerado
pelo `build.license` oficial do Vite com os textos integrais dos componentes
efetivamente incluídos no bundle do navegador.

O padrão de governança não mantém um verificador customizado deste inventário.
A paridade com a cópia em `public/legal/THIRDPARTY.md` e as eleições de licença
são revisadas quando os componentes ou os documentos legais mudam; o relatório
nativo do Vite não substitui essas verificações editoriais.

| Componente             | Escopo          | Licença declarada no lockfile | Licença aplicada | Modificado? | Origem                                             |
| ---------------------- | --------------- | ----------------------------- | ---------------- | ----------- | -------------------------------------------------- |
| `@biomejs/biome`       | desenvolvimento | MIT OR Apache-2.0             | Apache-2.0       | Não         | https://www.npmjs.com/package/@biomejs/biome       |
| `@tailwindcss/vite`    | desenvolvimento | MIT                           | MIT              | Não         | https://www.npmjs.com/package/@tailwindcss/vite    |
| `@types/react`         | desenvolvimento | MIT                           | MIT              | Não         | https://www.npmjs.com/package/@types/react         |
| `@types/react-dom`     | desenvolvimento | MIT                           | MIT              | Não         | https://www.npmjs.com/package/@types/react-dom     |
| `@vitejs/plugin-react` | desenvolvimento | MIT                           | MIT              | Não         | https://www.npmjs.com/package/@vitejs/plugin-react |
| `dompurify`            | runtime         | (MPL-2.0 OR Apache-2.0)       | Apache-2.0       | Não         | https://www.npmjs.com/package/dompurify            |
| `prettier`             | desenvolvimento | MIT                           | MIT              | Não         | https://www.npmjs.com/package/prettier             |
| `react`                | runtime         | MIT                           | MIT              | Não         | https://www.npmjs.com/package/react                |
| `react-dom`            | runtime         | MIT                           | MIT              | Não         | https://www.npmjs.com/package/react-dom            |
| `sanitize-html`        | runtime         | MIT                           | MIT              | Não         | https://www.npmjs.com/package/sanitize-html        |
| `tailwindcss`          | desenvolvimento | MIT                           | MIT              | Não         | https://www.npmjs.com/package/tailwindcss          |
| `typescript`           | desenvolvimento | Apache-2.0                    | Apache-2.0       | Não         | https://www.npmjs.com/package/typescript           |
| `vite`                 | desenvolvimento | MIT                           | MIT              | Não         | https://www.npmjs.com/package/vite                 |
| `vitest`               | desenvolvimento | MIT                           | MIT              | Não         | https://www.npmjs.com/package/vitest               |
| `wrangler`             | desenvolvimento | MIT OR Apache-2.0             | Apache-2.0       | Não         | https://www.npmjs.com/package/wrangler             |

## Atualização documental — 02/10/2026 (LCV-183 / LCV-211)

O Vitest 5.0.3 seleciona `why-is-node-running` 3.2.1, cuja publicação oficial não depende de `stackback`. A árvore exata permanece nos lockfiles regenerados pelo npm. Fonte: https://github.com/vitest-dev/vitest/pull/11316 e https://github.com/vitest-dev/vitest/releases/tag/v5.0.3. Esta atualização de ferramenta de teste não afirma incorporação no produto distribuído.

## Tailwind CSS — preview oficial e WASI (03/10/2026 UTC)

Os manifestos fixam `tailwindcss` e `@tailwindcss/vite` em `0.0.0-insiders.fa81d69`. O npm seleciona `@tailwindcss/node`, `@tailwindcss/oxide` e todas as variantes oficiais de plataforma na mesma revisão, segundo os contratos publicados pelo mantenedor. Trata-se do canal oficial **insiders**, publicado em 25/09/2026, e não de uma versão estável. A atualização é conjunta: nenhum filho de plataforma foi substituído contra o pin exato do pacote pai, e nenhum override adicional foi introduzido.

Fontes oficiais dos artefatos diretos: https://registry.npmjs.org/tailwindcss/-/tailwindcss-0.0.0-insiders.fa81d69.tgz e https://registry.npmjs.org/@tailwindcss/vite/-/vite-0.0.0-insiders.fa81d69.tgz. O pai WASI é https://registry.npmjs.org/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-0.0.0-insiders.fa81d69.tgz, SRI `sha512-CIJ8KPNg0sPva5lq/J93GTir00fdTyH2tJ9c6pJCXcmc6AhVDIY1NJyZ7ScsQqF8Asw4QVLFTgx5BRTsZU+7CA==`.

O artefato WASI incorpora `@tybys/wasm-util@0.10.3`. Os 39 arquivos publicados desse componente coincidem byte a byte com o tarball oficial https://registry.npmjs.org/@tybys/wasm-util/-/wasm-util-0.10.3.tgz, SRI `sha512-F3fo1MYrRJYL3zER0OUOmkutjr1Vp23m7OsSgp7nq4SP6OqX6C/56XFIPAl5bt3zaBRjmW7SGz3u/6LwFpYcOg==`. Seus 15 arquivos de código-fonte no commit `efb17cc128a30fb16b58127738f09c8871a3f7d1` coincidem com a revisão `a16b188d44ae43cc91edb71996ba2b43ff0996d9`, que acrescentou o texto MIT completo com `Copyright (c) 2022-present Toyobayashi`. Fonte imutável: https://raw.githubusercontent.com/toyobayashi/wasm-util/a16b188d44ae43cc91edb71996ba2b43ff0996d9/LICENSE; SHA-256 `09e436100bf926e78df875ec80cf3d0c643dfec779b52cfe2aa96afa0de714cb`.

O tarball 0.10.3 e a cópia incorporada não contêm LICENSE próprio: o texto é obtido da fonte relacionada exata e reproduzido integralmente no NOTICE canônico e público. Essa prova refere-se à versão 0.10.3 selecionada; não declara concessão retroativa para 0.10.2, nem transforma este aviso em prova de conformidade de todos os produtos distribuídos. A seleção dessa ferramenta não afirma incorporação de seu código nos bundles do navegador ou das Functions. Os relatórios de runtime preservam sua finalidade e proveniência próprias.

A fonte `src/wasi/path.ts` reconhece uma adaptação de `lib/path.js` do Node.js sob MIT; a PR upstream https://github.com/toyobayashi/wasm-util/pull/6 preserva essa atribuição. O NOTICE canônico/público reproduz separadamente o cabeçalho integral oficial de permissão e copyright `Joyent, Inc. and other Node contributors`. A concessão de Toyobayashi não substitui direitos ou avisos de terceiros. A PR não identifica a revisão exata do Node adaptada; o cabeçalho de licença foi observado idêntico em Node v22.20.0 e v24.21.0, o que não afirma igualdade byte a byte de toda a implementação nem certifica todas as obrigações de derivados. Nenhuma nova eleição de licença é introduzida.
