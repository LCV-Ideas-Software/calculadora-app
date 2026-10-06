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

## Tailwind CSS — preview oficial e WASI (04/10/2026 UTC)

Os manifestos fixam `tailwindcss` e `@tailwindcss/vite` na revisão oficial exata `0.0.0-insiders.fa81d69`, igualmente preservada no lockfile nativo. O `npm ci` reproduz essa seleção. As duas regras nativas `ignore.update-types` abrangem `version-update:semver-major`, `version-update:semver-minor` e `version-update:semver-patch`, restritas a esses pacotes no respectivo ecossistema npm. Atualizações ordinárias desses dois pacotes exigem revisão manual da nova identidade, da família inteira e dos grants antes de uma nova seleção exata, evitando também previews 0.x atualizados automaticamente sem prova. Atualizações de segurança não são suprimidas por essas condições de update-type e continuam exigindo os portões e a revisão aplicáveis. O cooldown, os grupos e as demais condições existentes permanecem. Não há novo override, alteração de política de licença ou consumidor customizado. Esta seleção não certifica grants de futuros previews. Contrato oficial: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference; implementação e testes completos: https://github.com/dependabot/dependabot-core/blob/0db0342964b1627e76be5d5449e7fbbf48b88b70/common/lib/dependabot/config/ignore_condition.rb e https://github.com/dependabot/dependabot-core/blob/0db0342964b1627e76be5d5449e7fbbf48b88b70/common/spec/dependabot/config/ignore_condition_spec.rb.

Em 04/10/2026, a correção CALCULA-29 restaurou esta seleção oficial conjunta no manifesto e no lockfile regenerado pelo npm. A seleção estável anterior 4.3.3 incorporava wasm-util 0.10.2; o preview aqui identificado incorpora 0.10.3. Foram reconferidos o SRI do pai, os 39 arquivos completos do filho publicado e os 15 caminhos e conteúdos de fonte, todos idênticos à revisão com o texto MIT integral citado abaixo. Esta prova usa a identidade do código licenciado, sem atribuir alcance retroativo à resposta upstream “Fixed in 0.10.4”.

O npm seleciona `@tailwindcss/node`, `@tailwindcss/oxide` e todas as variantes oficiais de plataforma na mesma revisão, segundo os contratos publicados pelo mantenedor. Trata-se do preview oficial **insiders**, publicado em 25/09/2026, e não de uma versão estável. A atualização é conjunta: nenhum filho de plataforma foi substituído contra o pin exato do pacote pai, e nenhum override adicional foi introduzido. A seleção estável anterior 4.3.3 incorporava `@tybys/wasm-util@0.10.2`, cuja fonte não coincide integralmente com a revisão licenciada abaixo; esta seleção retira essa identidade sem presumir autorização retroativa. Futuras atualizações exigem revisão da nova árvore, dos grants e destes avisos; a migração posterior para stable deve ser explícita.

Fontes oficiais dos artefatos diretos: https://registry.npmjs.org/tailwindcss/-/tailwindcss-0.0.0-insiders.fa81d69.tgz e https://registry.npmjs.org/@tailwindcss/vite/-/vite-0.0.0-insiders.fa81d69.tgz. O pai WASI é https://registry.npmjs.org/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-0.0.0-insiders.fa81d69.tgz, SRI `sha512-CIJ8KPNg0sPva5lq/J93GTir00fdTyH2tJ9c6pJCXcmc6AhVDIY1NJyZ7ScsQqF8Asw4QVLFTgx5BRTsZU+7CA==`.

O artefato WASI incorpora `@tybys/wasm-util@0.10.3`. Os 39 arquivos publicados desse componente coincidem byte a byte com o tarball oficial https://registry.npmjs.org/@tybys/wasm-util/-/wasm-util-0.10.3.tgz, SRI `sha512-F3fo1MYrRJYL3zER0OUOmkutjr1Vp23m7OsSgp7nq4SP6OqX6C/56XFIPAl5bt3zaBRjmW7SGz3u/6LwFpYcOg==`. Seus 15 arquivos de código-fonte no commit `efb17cc128a30fb16b58127738f09c8871a3f7d1` coincidem com a revisão `a16b188d44ae43cc91edb71996ba2b43ff0996d9`, que acrescentou o texto MIT completo com `Copyright (c) 2022-present Toyobayashi`. Fonte imutável: https://raw.githubusercontent.com/toyobayashi/wasm-util/a16b188d44ae43cc91edb71996ba2b43ff0996d9/LICENSE; SHA-256 `09e436100bf926e78df875ec80cf3d0c643dfec779b52cfe2aa96afa0de714cb`.

O tarball 0.10.3 e a cópia incorporada não contêm LICENSE próprio: o texto é obtido da fonte relacionada exata e reproduzido integralmente no NOTICE canônico e público. Essa prova refere-se à versão 0.10.3 selecionada; não declara concessão retroativa para 0.10.2, nem transforma este aviso em prova de conformidade de todos os produtos distribuídos. A seleção dessa ferramenta não afirma incorporação de seu código nos bundles do navegador ou das Functions. Os relatórios de runtime preservam sua finalidade e proveniência próprias.

A fonte `src/wasi/path.ts` reconhece uma adaptação de `lib/path.js` do Node.js sob MIT; a PR upstream https://github.com/toyobayashi/wasm-util/pull/6 preserva essa atribuição. O NOTICE canônico/público reproduz separadamente o cabeçalho integral oficial de permissão e copyright `Joyent, Inc. and other Node contributors`. A concessão de Toyobayashi não substitui direitos ou avisos de terceiros. A PR não identifica a revisão exata do Node adaptada; o cabeçalho de licença foi observado idêntico em Node v22.20.0 e v24.21.0, o que não afirma igualdade byte a byte de toda a implementação nem certifica todas as obrigações de derivados. Nenhuma nova eleição de licença é introduzida.

## Avisos suplementares das Pages Functions — 03/10/2026

Estes avisos completam os textos dos componentes abaixo efetivamente selecionados pelo empacotamento nativo das Pages Functions. O escopo foi conferido no metafile do artefato preservado do mesmo build, distinguindo o código de runtime das dependências usadas somente como ferramentas. Os manifestos e lockfiles continuam sendo as fontes das resoluções exatas. Este suplemento integra o aviso canônico e sua cópia pública em `legal/THIRDPARTY.md`; não substitui os demais avisos nem declara conformidade retroativa de entregas anteriores.

| Componente selecionado | Versão | Licença declarada | Fonte oficial |
| --- | --- | --- | --- |
| `path-to-regexp` | 6.3.0 | MIT | https://github.com/pillarjs/path-to-regexp |

O texto abaixo é o arquivo `package/LICENSE` integral do tarball oficial https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-6.3.0.tgz, cuja integridade SHA-512 coincide com o lockfile produtor. Seu SHA-256 é `4eeb3271453a891df609e5a9f4ee79a68307f730c13417a3bfeffa604ac8cf25`. A identificação corresponde ao módulo efetivamente selecionado, inclusive quando o empacotamento resolve uma dependência transitiva.

### path-to-regexp 6.3.0 — MIT

Fonte: https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-6.3.0.tgz

```text
The MIT License (MIT)

Copyright (c) 2014 Blake Embrey (hello@blakeembrey.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Inventário completo das Pages Functions — complemento de 03/10/2026

O suplemento anterior preserva o grant integral de `path-to-regexp` 6.3.0. Os avisos abaixo cobrem também os demais componentes selecionados no worker de referência, separadamente do inventário nativo do Vite para o navegador. A referência é [Deploy 37139350366, tentativa 1](https://github.com/LCV-Ideas-Software/calculadora-app/actions/runs/37139350366), fonte `3597dcc92d357f6dccd2604063369d46bc4f124c`, artefato nativo `11279402304`: `index.js` tem 453825 bytes e SHA-256 `ac87e4eeca3a3bfed7d10d71dbd9f3b6328fc2cc8fd01b042a3fe773d531affb`. O metafile preserva 88 inputs e 18 identidades reais de pacotes; cinco entradas `(disabled)` são placeholders, não código dos pacotes nomeados. O lockfile e a árvore completa `functions/` permanecem iguais na fonte `853d767eab7729e900f9d226a6a7012f9250df27` do complemento documental anterior. Esta referência identifica a execução examinada, sem prever hashes de builds futuros.

As resoluções abaixo usam o diretório de pacote mais específico de cada input, inclusive descendentes de `sanitize-html/node_modules`. “Inputs com código” conta somente `bytesInOutput` positivo. Os tarballs oficiais foram conferidos contra a integridade SHA-512 desse lockfile. Os textos completos correspondem aos artefatos selecionados; não se aplica a licença do compilador aos componentes que ele incorpora.

| Componente | Licença declarada | Inputs com código | Tarball oficial | SRI do lock |
| --- | --- | ---: | --- | --- |
| `dayjs@1.11.23` | MIT | 1 | https://registry.npmjs.org/dayjs/-/dayjs-1.11.23.tgz | sha512-QDTCU0M0MxR3hQfnlDJfwekQiaanm1ubOD231u73WBckQ/fsamwRLiE2GBz6D3a/xF1NgfiDLJjXBa1hYOYTtQ== |
| `deepmerge@4.3.1` | MIT | 1 | https://registry.npmjs.org/deepmerge/-/deepmerge-4.3.1.tgz | sha512-3sUqbMEc77XqpdNO7FRyRog+eW3ph+GYCbj+rK+uYyRMuwsVy0rMiVtPn+QJlKFvWP/1PYpapqYn0Me2knFn+A== |
| `dom-serializer@3.1.1` | MIT | 2 | https://registry.npmjs.org/dom-serializer/-/dom-serializer-3.1.1.tgz | sha512-4MEa38/QexBob6gFNwu+EGdWvhJ1OKuNwdYY3Y3NyeWDQfnGeDYQUDfIRzWu5B5gsv03so2Uxd28YC6zrsx3Lw== |
| `domelementtype@3.0.0` | BSD-2-Clause | 1 | https://registry.npmjs.org/domelementtype/-/domelementtype-3.0.0.tgz | sha512-umCQid3jKbDmVjx8jGaW7uUykm4DEUeyV21hPxNMo2nV955DhUThwqyOIDtreepP31hl84X7G5U9ZfsWvIB3Pg== |
| `domhandler@6.0.1` | BSD-2-Clause | 2 | https://registry.npmjs.org/domhandler/-/domhandler-6.0.1.tgz | sha512-gYzvtM72ZtxQO0T048kd6HWSbbGCNOUwcnfQ01cqIJ4X2IYKFFHZ5mKvrQETcFXxsRObZulDaKmy//R7TPtsBg== |
| `domutils@4.0.2` | BSD-2-Clause | 8 | https://registry.npmjs.org/domutils/-/domutils-4.0.2.tgz | sha512-qI4JLRKnSzqFqr7hAlS5xQDusBCjKSEG4t4+7aNrIQMHBcsC2TGEhuyABJdYkgSewL57PNLYEiibY2iPKhKpaA== |
| `entities@8.0.0` | BSD-2-Clause | 8 | https://registry.npmjs.org/entities/-/entities-8.0.0.tgz | sha512-zwfzJecQ/Uej6tusMqwAqU/6KL2XaB2VZ2Jg54Je6ahNBGNH6Ek6g3jjNCF0fG9EWQKGZNddNjU5F1ZQn/sBnA== |
| `escape-string-regexp@4.0.0` | MIT | 1 | https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz | sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA== |
| `htmlparser2@12.0.0` | MIT | 3 | https://registry.npmjs.org/htmlparser2/-/htmlparser2-12.0.0.tgz | sha512-Tz7u1i95/g2x2jz81+x0FBVhBhY5aRTvD3tXXdFaljuNdzDLJ8UGNRrTcj2cgQvAg3iW/h77Fz15nLW0L0CrZw== |
| `is-plain-object@5.0.0` | MIT | 1 | https://registry.npmjs.org/is-plain-object/-/is-plain-object-5.0.0.tgz | sha512-VRSzKkbMm5jMDoKLbltAkFQ5Qr7VDiTFGXxYFXXowVj387GeGNOCsOH6Msy00SGZ3Fp84b1Naa1psqgcCIEP5Q== |
| `launder@1.7.2` | MIT | 1 | https://registry.npmjs.org/launder/-/launder-1.7.2.tgz | sha512-DLg3HPnHUfBi5/MxMLmJD12dmlMpFEC2HgMW6vkZ/9JR0RU00kXoRGvDxAvFmdO0o610OA77i4FgNTLucmhDVg== |
| `nanoid@3.3.18` | MIT | 1 | https://registry.npmjs.org/nanoid/-/nanoid-3.3.18.tgz | sha512-DTg4MJbGMWkfi6VZFdNt2/caMbQy4Ou+Op/hJQvGEWcnVfoA1QA+xzRKAzw9jD6+GVOOeYr/mIcuDSdug6F6+w== |
| `parse-srcset@1.0.2` | MIT | 1 | https://registry.npmjs.org/parse-srcset/-/parse-srcset-1.0.2.tgz | sha512-/2qh0lav6CmI15FzA3i/2Bzk2zCgQhGMkvhOhKNcBVQ1ldgpbfiNTVslmooUmWJcADi1f1kIeynbDRVzNlfR6Q== |
| `path-to-regexp@6.3.0` | MIT | 1 | https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-6.3.0.tgz | sha512-Yhpw4T9C6hPpgPeA28us07OJeqZ5EzQTkbfwuhsUg0c237RomFoETJgmp2sa3F/41gfLE6G5cqcYwznmeEeOlQ== |
| `picocolors@1.1.1` | ISC | 1 | https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz | sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA== |
| `postcss@8.5.28` | MIT | 27 | https://registry.npmjs.org/postcss/-/postcss-8.5.28.tgz | sha512-RRuzqDtt5Y9h3quz5hWhK+TPnsmVs6WwSU6LkJMeY4HstUEDuYTG8UJSdawMRzmzAtV+KEoG8N3Qg2qLy5vM/A== |
| `sanitize-html@2.17.7` | MIT | 1 | https://registry.npmjs.org/sanitize-html/-/sanitize-html-2.17.7.tgz | sha512-PGtEkc9cbnedU3s9TmzDbpsZ8w086g/0Q8k8/oIO1NLNU3i5k9yn835CrjJSajp1KMmkisbO1qPXxNKO3welAg== |
| `wrangler@4.147.0` | MIT OR Apache-2.0 | 1 | https://registry.npmjs.org/wrangler/-/wrangler-4.147.0.tgz | sha512-pQYRoiq8PTAxphaG69z8+GC1DkSGd19EDZehQ8zxjo/Ko3mRB6Qs1mTrd8ZuKAarLklIjTqr1lUdCK9r4q2hUg== |

Os 17 componentes abaixo complementam o texto de `path-to-regexp` já reproduzido integralmente. As expressões alternativas permanecem preservadas. Nenhuma eleição nova, dependência, configuração ou código de runtime é alterado.

### dayjs@1.11.23

Fonte: <https://registry.npmjs.org/dayjs/-/dayjs-1.11.23.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
MIT License

Copyright (c) 2018-present, iamkun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### deepmerge@4.3.1

Fonte: <https://registry.npmjs.org/deepmerge/-/deepmerge-4.3.1.tgz>; texto integral do artefato exato.

#### package/license.txt

```text
The MIT License (MIT)

Copyright (c) 2012 James Halliday, Josh Duff, and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### dom-serializer@3.1.1

Fonte: <https://registry.npmjs.org/dom-serializer/-/dom-serializer-3.1.1.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
Copyright © 2022 The Cheerio contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### domelementtype@3.0.0

Fonte: <https://registry.npmjs.org/domelementtype/-/domelementtype-3.0.0.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
Copyright (c) Felix Böhm
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### domhandler@6.0.1

Fonte: <https://registry.npmjs.org/domhandler/-/domhandler-6.0.1.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
Copyright (c) Felix Böhm
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### domutils@4.0.2

Fonte: <https://registry.npmjs.org/domutils/-/domutils-4.0.2.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
Copyright (c) Felix Böhm
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### entities@8.0.0

Fonte: <https://registry.npmjs.org/entities/-/entities-8.0.0.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
Copyright (c) Felix Böhm
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### escape-string-regexp@4.0.0

Fonte: <https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz>; texto integral do artefato exato.

#### package/license

```text
MIT License

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### htmlparser2@12.0.0

Fonte: <https://registry.npmjs.org/htmlparser2/-/htmlparser2-12.0.0.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
Copyright 2010, 2011, Chris Winberry <chris@winberry.net>. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
 
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
```

### is-plain-object@5.0.0

Fonte: <https://registry.npmjs.org/is-plain-object/-/is-plain-object-5.0.0.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
The MIT License (MIT)

Copyright (c) 2014-2017, Jon Schlinkert.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### launder@1.7.2

Fonte: <https://registry.npmjs.org/launder/-/launder-1.7.2.tgz>; texto integral do artefato exato.

#### package/LICENSE.md

```text
Copyright (c) 2021 Apostrophe Technologies, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### nanoid@3.3.18

Fonte: <https://registry.npmjs.org/nanoid/-/nanoid-3.3.18.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
The MIT License (MIT)

Copyright 2017 Andrey Sitnik <andrey@sitnik.ru>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### parse-srcset@1.0.2

Fonte: <https://registry.npmjs.org/parse-srcset/-/parse-srcset-1.0.2.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
The MIT License (MIT)

Copyright (c) 2014 Alex Bell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```

### picocolors@1.1.1

Fonte: <https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
ISC License

Copyright (c) 2021-2024 Oleksii Raspopov, Kostiantyn Denysov, Anton Verinov

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### postcss@8.5.28

Fonte: <https://registry.npmjs.org/postcss/-/postcss-8.5.28.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
The MIT License (MIT)

Copyright 2013 Andrey Sitnik <andrey@sitnik.es>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### sanitize-html@2.17.7

Fonte: <https://registry.npmjs.org/sanitize-html/-/sanitize-html-2.17.7.tgz>; texto integral do artefato exato.

#### package/LICENSE

```text
Copyright (c) 2013, 2014, 2015 P'unk Avenue LLC

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### wrangler@4.147.0

O template Pages selecionado vem do tarball exato de Wrangler 4.147.0 e coincide byte a byte com o template do commit `64c1337155a6bc7224b5d47f58ca521d8b8ee3fe` de workers-sdk. A proveniência npm publicada relaciona o SHA-512 exato desse tarball ao mesmo commit, produzido pelo workflow oficial `changesets.yml`, [execução 37000143168, tentativa 1](https://github.com/cloudflare/workers-sdk/actions/runs/37000143168/attempts/1). A comparação documental do sujeito não afirma verificação criptográfica da atestação. O pacote declara `MIT OR Apache-2.0`; ambos os textos integrais da origem são preservados abaixo, sem nova eleição.

#### LICENSE-MIT

Fonte exata: <https://github.com/cloudflare/workers-sdk/blob/64c1337155a6bc7224b5d47f58ca521d8b8ee3fe/LICENSE-MIT>.

```text
Copyright (c) 2020 Cloudflare, Inc. <wrangler@cloudflare.com>

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

#### LICENSE-APACHE

Fonte exata: <https://github.com/cloudflare/workers-sdk/blob/64c1337155a6bc7224b5d47f58ca521d8b8ee3fe/LICENSE-APACHE>.

```text
                              Apache License
                        Version 2.0, January 2004
                     http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

   "License" shall mean the terms and conditions for use, reproduction,
   and distribution as defined by Sections 1 through 9 of this document.

   "Licensor" shall mean the copyright owner or entity authorized by
   the copyright owner that is granting the License.

   "Legal Entity" shall mean the union of the acting entity and all
   other entities that control, are controlled by, or are under common
   control with that entity. For the purposes of this definition,
   "control" means (i) the power, direct or indirect, to cause the
   direction or management of such entity, whether by contract or
   otherwise, or (ii) ownership of fifty percent (50%) or more of the
   outstanding shares, or (iii) beneficial ownership of such entity.

   "You" (or "Your") shall mean an individual or Legal Entity
   exercising permissions granted by this License.

   "Source" form shall mean the preferred form for making modifications,
   including but not limited to software source code, documentation
   source, and configuration files.

   "Object" form shall mean any form resulting from mechanical
   transformation or translation of a Source form, including but
   not limited to compiled object code, generated documentation,
   and conversions to other media types.

   "Work" shall mean the work of authorship, whether in Source or
   Object form, made available under the License, as indicated by a
   copyright notice that is included in or attached to the work
   (an example is provided in the Appendix below).

   "Derivative Works" shall mean any work, whether in Source or Object
   form, that is based on (or derived from) the Work and for which the
   editorial revisions, annotations, elaborations, or other modifications
   represent, as a whole, an original work of authorship. For the purposes
   of this License, Derivative Works shall not include works that remain
   separable from, or merely link (or bind by name) to the interfaces of,
   the Work and Derivative Works thereof.

   "Contribution" shall mean any work of authorship, including
   the original version of the Work and any modifications or additions
   to that Work or Derivative Works thereof, that is intentionally
   submitted to Licensor for inclusion in the Work by the copyright owner
   or by an individual or Legal Entity authorized to submit on behalf of
   the copyright owner. For the purposes of this definition, "submitted"
   means any form of electronic, verbal, or written communication sent
   to the Licensor or its representatives, including but not limited to
   communication on electronic mailing lists, source code control systems,
   and issue tracking systems that are managed by, or on behalf of, the
   Licensor for the purpose of discussing and improving the Work, but
   excluding communication that is conspicuously marked or otherwise
   designated in writing by the copyright owner as "Not a Contribution."

   "Contributor" shall mean Licensor and any individual or Legal Entity
   on behalf of whom a Contribution has been received by Licensor and
   subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   copyright license to reproduce, prepare Derivative Works of,
   publicly display, publicly perform, sublicense, and distribute the
   Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of
   this License, each Contributor hereby grants to You a perpetual,
   worldwide, non-exclusive, no-charge, royalty-free, irrevocable
   (except as stated in this section) patent license to make, have made,
   use, offer to sell, sell, import, and otherwise transfer the Work,
   where such license applies only to those patent claims licensable
   by such Contributor that are necessarily infringed by their
   Contribution(s) alone or by combination of their Contribution(s)
   with the Work to which such Contribution(s) was submitted. If You
   institute patent litigation against any entity (including a
   cross-claim or counterclaim in a lawsuit) alleging that the Work
   or a Contribution incorporated within the Work constitutes direct
   or contributory patent infringement, then any patent licenses
   granted to You under this License for that Work shall terminate
   as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the
   Work or Derivative Works thereof in any medium, with or without
   modifications, and in Source or Object form, provided that You
   meet the following conditions:

   (a) You must give any other recipients of the Work or
       Derivative Works a copy of this License; and

   (b) You must cause any modified files to carry prominent notices
       stating that You changed the files; and

   (c) You must retain, in the Source form of any Derivative Works
       that You distribute, all copyright, patent, trademark, and
       attribution notices from the Source form of the Work,
       excluding those notices that do not pertain to any part of
       the Derivative Works; and

   (d) If the Work includes a "NOTICE" text file as part of its
       distribution, then any Derivative Works that You distribute must
       include a readable copy of the attribution notices contained
       within such NOTICE file, excluding those notices that do not
       pertain to any part of the Derivative Works, in at least one
       of the following places: within a NOTICE text file distributed
       as part of the Derivative Works; within the Source form or
       documentation, if provided along with the Derivative Works; or,
       within a display generated by the Derivative Works, if and
       wherever such third-party notices normally appear. The contents
       of the NOTICE file are for informational purposes only and
       do not modify the License. You may add Your own attribution
       notices within Derivative Works that You distribute, alongside
       or as an addendum to the NOTICE text from the Work, provided
       that such additional attribution notices cannot be construed
       as modifying the License.

   You may add Your own copyright statement to Your modifications and
   may provide additional or different license terms and conditions
   for use, reproduction, or distribution of Your modifications, or
   for any such Derivative Works as a whole, provided Your use,
   reproduction, and distribution of the Work otherwise complies with
   the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise,
   any Contribution intentionally submitted for inclusion in the Work
   by You to the Licensor shall be under the terms and conditions of
   this License, without any additional terms or conditions.
   Notwithstanding the above, nothing herein shall supersede or modify
   the terms of any separate license agreement you may have executed
   with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade
   names, trademarks, service marks, or product names of the Licensor,
   except as required for reasonable and customary use in describing the
   origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or
   agreed to in writing, Licensor provides the Work (and each
   Contributor provides its Contributions) on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
   implied, including, without limitation, any warranties or conditions
   of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
   PARTICULAR PURPOSE. You are solely responsible for determining the
   appropriateness of using or redistributing the Work and assume any
   risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory,
   whether in tort (including negligence), contract, or otherwise,
   unless required by applicable law (such as deliberate and grossly
   negligent acts) or agreed to in writing, shall any Contributor be
   liable to You for damages, including any direct, indirect, special,
   incidental, or consequential damages of any character arising as a
   result of this License or out of the use or inability to use the
   Work (including but not limited to damages for loss of goodwill,
   work stoppage, computer failure or malfunction, or any and all
   other commercial damages or losses), even if such Contributor
   has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing
   the Work or Derivative Works thereof, You may choose to offer,
   and charge a fee for, acceptance of support, warranty, indemnity,
   or other liability obligations and/or rights consistent with this
   License. However, in accepting such obligations, You may act only
   on Your own behalf and on Your sole responsibility, not on behalf
   of any other Contributor, and only if You agree to indemnify,
   defend, and hold each Contributor harmless for any liability
   incurred by, or claims asserted against, such Contributor by reason
   of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS
```

## Scoped Miniflare security correction

The operator approved the temporary npm override `miniflare` → `sharp` 0.35.5 on
06/10/2026 for GHSA-wq5f-xc86-pv6w. npm regenerates the affected lockfile; existing
Wrangler and Miniflare selections remain unchanged. Remove this override after
the official upstream selects a corrected Sharp version. Sharp retains its
Apache-2.0 grant and the native libvips components retain their own LGPL notices;
this build-tool correction does not certify complete distribution compliance.

Source: <https://github.com/advisories/GHSA-wq5f-xc86-pv6w>.
