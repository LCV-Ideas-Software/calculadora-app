# Third-Party Components

Este inventário cobre todas as dependências diretas declaradas em `package.json`,
inclusive a licença aplicada quando o pacote oferece alternativas. As versões
exatas e as dependências transitivas permanecem registradas no
[`package-lock.json`](https://github.com/LCV-Ideas-Software/calculadora-app/blob/main/package-lock.json).
Cada build de produção também publica `/legal/THIRD-PARTY-NOTICES.json`, gerado
pelo `build.license` oficial do Vite com os textos integrais dos componentes
efetivamente incluídos no bundle do navegador.

| Componente | Escopo | Licença declarada no lockfile | Licença aplicada | Modificado? | Origem |
|------------|--------|--------------------------------|-------------------|-------------|--------|
| `@biomejs/biome` | desenvolvimento | MIT OR Apache-2.0 | Apache-2.0 | Não | https://www.npmjs.com/package/@biomejs/biome |
| `@tailwindcss/vite` | desenvolvimento | MIT | MIT | Não | https://www.npmjs.com/package/@tailwindcss/vite |
| `@types/react` | desenvolvimento | MIT | MIT | Não | https://www.npmjs.com/package/@types/react |
| `@types/react-dom` | desenvolvimento | MIT | MIT | Não | https://www.npmjs.com/package/@types/react-dom |
| `@vitejs/plugin-react` | desenvolvimento | MIT | MIT | Não | https://www.npmjs.com/package/@vitejs/plugin-react |
| `dompurify` | runtime | (MPL-2.0 OR Apache-2.0) | Apache-2.0 | Não | https://www.npmjs.com/package/dompurify |
| `prettier` | desenvolvimento | MIT | MIT | Não | https://www.npmjs.com/package/prettier |
| `react` | runtime | MIT | MIT | Não | https://www.npmjs.com/package/react |
| `react-dom` | runtime | MIT | MIT | Não | https://www.npmjs.com/package/react-dom |
| `sanitize-html` | runtime | MIT | MIT | Não | https://www.npmjs.com/package/sanitize-html |
| `tailwindcss` | desenvolvimento | MIT | MIT | Não | https://www.npmjs.com/package/tailwindcss |
| `typescript` | desenvolvimento | Apache-2.0 | Apache-2.0 | Não | https://www.npmjs.com/package/typescript |
| `vite` | desenvolvimento | MIT | MIT | Não | https://www.npmjs.com/package/vite |
| `vitest` | desenvolvimento | MIT | MIT | Não | https://www.npmjs.com/package/vitest |
