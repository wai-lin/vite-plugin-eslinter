export const baseRendererUi = ({
  linterUiId,
  linterHtmlRoute,
}: {
  linterUiId: string
  linterHtmlRoute: string
}) => `
        <section id="${linterUiId}" style="display: none;">
          <div id="eslinter-pop-up-header">
            <button
              type="button"
              id="eslinter-pop-up-close-btn"
            >
              Close
            </button>
          </div>
          <iframe src="${linterHtmlRoute}" title="eslint_errors"></iframe>
        </section>
  
        
        <style>
        #vite-eslinter-pop-up-ui {
          position: absolute;
          inset: 0;
          width: 100vw;
          height: 100vh;
          font-size: 16px;
          padding: 0;
          margin: 0;
          overflow-y: hidden;
          z-index: 99999;
          background-color: #fff;
        }
        #vite-eslinter-pop-up-ui iframe {
          width: 100%;
          height: calc(100vh - 80px);
          border: none;
          margin: 0;
          padding: 0;
          overflow-y: auto;
        }
        #eslinter-pop-up-header {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 0 1em;
          height: 80px;
        }
        #eslinter-pop-up-close-btn {
          font-size: 16px;
          padding: 0.25em 0.5em;
          border: none;
          border-radius: 0.25em;
          cursor: pointer;
        }
        #eslinter-pop-up-close-btn:hover {
          opacity: 0.8;
        }
        #eslinter-pop-up-close-btn:active {
          opacity: 1;
        }
        </style>

        <script>
          function closeEslintPopUp() {
            document.querySelector('#${linterUiId}').style.display = 'none';
          }
          window.onload = () => {
            document.getElementById('eslinter-pop-up-close-btn').removeEventListener('click', closeEslintPopUp)
            document.getElementById('eslinter-pop-up-close-btn').addEventListener('click', closeEslintPopUp)
          }
        </script>
  
        </body>
      `
