(function () {
  const CLIPS_ORIGIN = "https://chzzk.naver.com";
  const CLIPS_BASE_PATH = "/clips";

  const LIVE_WRAP_SELECTOR = 'div[class*="FloatingButtonView-module__wrap__"]';
  const LIVE_LINK_SELECTOR = 'a[class*="FloatingButtonView-module__link__"]';
  const CONTROL_WRAP_SELECTOR =
    'div[class*="ControlAreaView-module__touch_wrap__"]';

  const NAV_BUTTON_SELECTOR = [
    'button[class*="NavigationLayerView-module__btn_prev__"]',
    'button[class*="NavigationLayerView-module__btn_next__"]',
  ].join(", ");
  const NAV_BOX_SELECTOR =
    'div[class*="NavigationLayerView-module__nav_box__"]';
  const HOVER_ZONE_SELECTOR = [
    CONTROL_WRAP_SELECTOR,
    NAV_BOX_SELECTOR,
    NAV_BUTTON_SELECTOR,
  ].join(", ");

  let shouldShowControls = false;

  function isClipsUrl(url) {
    if (!url) return false;

    try {
      const parsed = new URL(url);
      return (
        parsed.origin === CLIPS_ORIGIN &&
        (parsed.pathname === CLIPS_BASE_PATH ||
          parsed.pathname.startsWith(`${CLIPS_BASE_PATH}/`))
      );
    } catch {
      return false;
    }
  }

  function isClipsContext() {
    if (isClipsUrl(window.location.href)) return true;

    try {
      return isClipsUrl(window.top.location.href);
    } catch {
      // Ignore cross-origin access errors.
    }

    return isClipsUrl(document.referrer);
  }

  function hideElement(el) {
    if (!el) return;

    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("pointer-events", "none", "important");
  }

  function showElement(el) {
    if (!el) return;

    el.style.removeProperty("display");
    el.style.removeProperty("visibility");
    el.style.removeProperty("pointer-events");
  }

  function isTargetLiveLink(link) {
    if (!link) return false;
    if (!link.matches(LIVE_LINK_SELECTOR)) return false;
    if (!link.href.includes("/live/")) return false;

    return (link.textContent || "").includes("클릭하여 라이브 시청");
  }

  function findLiveTargets(root = document) {
    const targets = [];

    const wrappers = root.querySelectorAll(LIVE_WRAP_SELECTOR);
    wrappers.forEach((wrap) => {
      const link = wrap.querySelector('a[href*="/live/"]');
      if (!isTargetLiveLink(link)) return;
      targets.push({ wrap, link });
    });

    const links = root.querySelectorAll('a[href*="/live/"]');
    links.forEach((link) => {
      if (!isTargetLiveLink(link)) return;
      if (link.closest(LIVE_WRAP_SELECTOR)) return;
      targets.push({ wrap: null, link });
    });

    return targets;
  }

  function updateLiveButtonVisibility(root = document) {
    const targets = findLiveTargets(root);

    targets.forEach(({ wrap, link }) => {
      const target = wrap || link;
      hideElement(target);
    });
  }

  function updateNavigationVisibility(root = document) {
    const navBoxes = root.querySelectorAll(NAV_BOX_SELECTOR);
    const navButtons = root.querySelectorAll(NAV_BUTTON_SELECTOR);

    if (shouldShowControls) {
      navBoxes.forEach(showElement);
      navButtons.forEach((button) => {
        const hiddenByAria = button.getAttribute("aria-hidden") === "true";
        if (hiddenByAria) {
          hideElement(button);
        } else {
          showElement(button);
        }
      });
      return;
    }

    navButtons.forEach(hideElement);
    navBoxes.forEach(hideElement);
  }

  function applyUiState(root = document) {
    if (!isClipsContext()) return;

    updateNavigationVisibility(root);
    updateLiveButtonVisibility(root);
  }

  function isInHoverZone(node) {
    if (!(node instanceof Node)) return false;

    const el = node instanceof Element ? node : node.parentElement || null;
    if (!el) return false;

    return Boolean(el.closest(HOVER_ZONE_SELECTOR));
  }

  function onMouseOver(event) {
    if (!isClipsContext()) return;
    if (!(event.target instanceof Element)) return;
    if (!isInHoverZone(event.target)) return;

    if (shouldShowControls) return;

    shouldShowControls = true;
    applyUiState();
  }

  function onMouseOut(event) {
    if (!isClipsContext()) return;
    if (!isInHoverZone(event.target)) return;
    if (isInHoverZone(event.relatedTarget)) return;

    if (!shouldShowControls) return;

    shouldShowControls = false;
    applyUiState();
  }

  function onMutations(mutations) {
    if (!isClipsContext()) return;

    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        applyUiState();
        break;
      }

      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        applyUiState();
        break;
      }
    }
  }

  document.addEventListener("mouseover", onMouseOver, true);
  document.addEventListener("mouseout", onMouseOut, true);

  window.addEventListener("blur", () => {
    if (!shouldShowControls) return;

    shouldShowControls = false;
    applyUiState();
  });

  applyUiState();

  const observer = new MutationObserver(onMutations);
  const startObserver = () => {
    if (!document.documentElement) return;

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-hidden", "class"],
    });
  };

  if (document.documentElement) {
    startObserver();
  } else {
    document.addEventListener("DOMContentLoaded", startObserver, {
      once: true,
    });
  }
})();
