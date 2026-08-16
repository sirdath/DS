/** Sets the persisted theme on <html> before hydration, so the assistant never
 *  flashes dark-then-light (or vice versa) on load. Scoped to this route only:
 *  the attribute name is assistant-specific and no other route reads it. */
const NO_FLASH_SCRIPT = `(function(){try{
  var v=localStorage.getItem("ds2-assistant-theme");
  if(v!=="light"&&v!=="dark"){v=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}
  document.documentElement.setAttribute("data-assistant-theme",v);
}catch(e){}})();`;

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return <>
    <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
    {children}
  </>;
}
