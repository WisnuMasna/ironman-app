/** Inline theme boot to avoid a flash. Runs before paint. */
export function ThemeBootScript() {
  const code = `(function(){try{var t=localStorage.getItem('triplan-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
