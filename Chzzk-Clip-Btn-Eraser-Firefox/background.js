chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== "install" && details.reason !== "update") {
    return;
  }

  const tabs = await chrome.tabs.query({
    url: ["https://chzzk.naver.com/*", "https://m.naver.com/shorts/*"],
  });

  for (const tab of tabs) {
    if (typeof tab.id !== "number") continue;

    chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        func: showUpdateBanner,
      })
      .catch(() => {});
  }
});

function showUpdateBanner() {
  const bannerId = "clip-remover-update-banner";
  if (document.getElementById(bannerId)) return;

  const banner = document.createElement("div");
  banner.id = bannerId;
  banner.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:100%",
    "z-index:2147483647",
    "background:#111827",
    "color:#fff",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "gap:10px",
    "padding:10px 12px",
    "font-size:13px",
    "font-weight:600",
    "box-shadow:0 2px 10px rgba(0,0,0,.35)",
  ].join(";");

  const message = document.createElement("span");
  message.textContent =
    "클립 리무버가 업데이트되었습니다. 적용을 위해 새로고침 해주세요.";

  const reloadBtn = document.createElement("button");
  reloadBtn.type = "button";
  reloadBtn.textContent = "새로고침";
  reloadBtn.style.cssText = [
    "border:none",
    "border-radius:6px",
    "padding:6px 10px",
    "font-size:12px",
    "font-weight:700",
    "cursor:pointer",
    "background:#22c55e",
    "color:#0b1220",
  ].join(";");
  reloadBtn.addEventListener("click", () => location.reload());

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "닫기";
  closeBtn.style.cssText = [
    "border:1px solid rgba(255,255,255,.35)",
    "border-radius:6px",
    "padding:6px 10px",
    "font-size:12px",
    "font-weight:600",
    "cursor:pointer",
    "background:transparent",
    "color:#fff",
  ].join(";");
  closeBtn.addEventListener("click", () => banner.remove());

  banner.appendChild(message);
  banner.appendChild(reloadBtn);
  banner.appendChild(closeBtn);

  const mount = () => {
    const root = document.body || document.documentElement;
    if (!root || document.getElementById(bannerId)) return;
    root.appendChild(banner);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
}
