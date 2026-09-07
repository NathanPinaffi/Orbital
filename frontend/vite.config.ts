import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// public/tikzjax/*.gz são payloads pré-comprimidos que o TikZJax baixa via fetch() e
// descomprime ele mesmo em JS (pako) — não é "compressão de transporte" HTTP normal. O
// servidor de dev do Vite (sirv) detecta a extensão .gz e marca a resposta com
// "Content-Encoding: gzip", fazendo o navegador descomprimir o arquivo sozinho antes do
// JS recebê-lo; o pako então tenta descomprimir de novo um buffer que já não é mais gzip
// e falha. Sem esse plugin o TikZJax quebra em dev (mesmo comportamento seria replicado em
// produção via vercel.json).
function tikzjaxRawGzip(): Plugin {
  return {
    name: 'tikzjax-raw-gzip',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/tikzjax/') && req.url.endsWith('.gz')) {
          res.setHeader('Content-Encoding', 'identity');
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tikzjaxRawGzip()],
})
