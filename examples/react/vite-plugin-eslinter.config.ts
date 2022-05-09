import path from 'node:path'
import { htmlFormatter, TPluginEslinterConfig } from 'vite-plugin-eslinter'

const projRoot = path.resolve(__dirname)

export const eslinterConfig: TPluginEslinterConfig = {
  lintFiles: [path.resolve(projRoot, './src/**/*.{ts,tsx}')],
  baseRendererUI: ({ containerId, closeBtnId, iframeUrl, scriptTag }) => `
<section id="${containerId}">
  <div>
    <button type="button" id="${closeBtnId}">Close</button>
  </div>
  <iframe title="eslint_errors" src="${iframeUrl}"></iframe>
</section>
<style>
  #${containerId} {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    font-family: Courier;
    padding: 1rem;
  }
  #${containerId} * {
    box-sizing: border-box;
  }
  #${containerId} > div {
    width: 100%;
    padding: 0.5em 1rem;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  #${closeBtnId} {
    border: none;
    background: transparent;
    font-size: 14px;
    cursor: pointer;
    color: white;
  }
  #${closeBtnId}:hover {
    opacity: 0.8;
  }
  #${closeBtnId}:active {
    opacity: 1;
  }
  #${containerId} iframe {
    border: none;
    margin: 0;
    padding: 0;
    width: 100%;
    height: auto;
  }
</style>
${scriptTag}
</body>
`,
  formatter: {
    browser: htmlFormatter,
  },
}
