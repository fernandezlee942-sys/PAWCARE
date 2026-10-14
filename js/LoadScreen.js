    document.addEventListener("DOMContentLoaded", () => {
      const currentPath = window.location.pathname.toLowerCase();
      const isLoadingPage = currentPath.includes("catloading.html");

      if (isLoadingPage) {
        const nextPage = sessionStorage.getItem("nextPage");

        setTimeout(() => {
          sessionStorage.removeItem("nextPage");
          window.location.replace(nextPage || "index.html");
        }, 2000);

        return;
      }

      document.querySelectorAll("a[href]").forEach(link => {
        link.addEventListener("click", event => {
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            link.target === "_blank" ||
            link.hasAttribute("download") ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.metaKey
          ) return;

          const destination = new URL(link.href, window.location.href);

          if (
            destination.origin !== window.location.origin ||
            destination.pathname.toLowerCase().includes("catloading.html") ||
            (destination.pathname === window.location.pathname && destination.hash)
          ) return;

          event.preventDefault();
          sessionStorage.setItem("nextPage", destination.href);
          window.location.href = new URL("CatLoading.html", window.location.href).href;
        });
      });
    });