/**
 * Portfolio interactions:
 * mobile nav, scroll state, filters, copy-to-clipboard, and the contact form.
 * No framework — the DOM is the source of truth.
 */

(function () {
  const root = document.documentElement;
  root.classList.add("js");
  const nav = document.querySelector(".nav");
  const navLinks = document.getElementById("nav-links");
  const navToggle = document.getElementById("nav-toggle");
  const toast = document.getElementById("toast");
  const year = document.getElementById("year");

  if (year) year.textContent = String(new Date().getFullYear());

  try {
    localStorage.removeItem("ab-theme");
  } catch (err) {
    /* Ignore storage errors */
  }

  /* ------------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------------ */

  function setMenu(open) {
    navLinks.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    navToggle.innerHTML = open
      ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  }

  navToggle.addEventListener("click", function () {
    setMenu(!navLinks.classList.contains("is-open"));
  });

  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });

  /* ------------------------------------------------------------------------
     Scroll: nav shadow + current section
     ------------------------------------------------------------------------ */

  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const menuAnchors = Array.from(navLinks.querySelectorAll("a"));

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("id");
          menuAnchors.forEach(function (anchor) {
            const active = anchor.getAttribute("href") === "#" + id;
            anchor.classList.toggle("is-active", active);
            if (active) anchor.setAttribute("aria-current", "true");
            else anchor.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0.01 }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  /* ------------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------------ */

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -32px 0px" }
    );

    document.querySelectorAll(".reveal").forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (item) {
      item.classList.add("is-in");
    });
  }

  /* ------------------------------------------------------------------------
     Filters
     ------------------------------------------------------------------------ */

  function bindFilter(toolbar, buttonAttr, cards, readCategories) {
    const buttons = toolbar.querySelectorAll("button");
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        const filter = button.getAttribute(buttonAttr);
        buttons.forEach(function (other) {
          const active = other === button;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", String(active));
        });

        let visible = 0;
        cards.forEach(function (card) {
          const categories = readCategories(card);
          const show = filter === "all" || categories.indexOf(filter) !== -1;
          card.classList.toggle("is-hidden", !show);
          if (show) visible += 1;
        });

        const empty = document.getElementById("project-empty");
        if (empty && toolbar.id === "project-filters") {
          empty.hidden = visible !== 0;
        }
      });
    });
  }

  bindFilter(
    document.getElementById("skill-filters"),
    "data-skill-filter",
    document.querySelectorAll("[data-skill]"),
    function (card) { return [card.getAttribute("data-skill")]; }
  );

  bindFilter(
    document.getElementById("project-filters"),
    "data-project-filter",
    document.querySelectorAll("[data-categories]"),
    function (card) { return card.getAttribute("data-categories").split(/\s+/); }
  );

  /* ------------------------------------------------------------------------
     Toast + copy
     ------------------------------------------------------------------------ */

  let toastTimer = 0;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    showToast("Copied to clipboard");
  }

  document.querySelectorAll("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      copyText(button.getAttribute("data-copy"));
    });
  });

  /* ------------------------------------------------------------------------
     Contact form — validated in the browser, then handed to the mail client
     ------------------------------------------------------------------------ */

  const form = document.getElementById("contact-form");
  const success = document.getElementById("form-success");
  const mailtoLink = document.getElementById("mailto-link");
  const resetButton = document.getElementById("reset-form");

  const fields = {
    name: {
      el: document.getElementById("name"),
      error: document.getElementById("name-error"),
      check: function (value) {
        if (value.trim().length < 2) return "Please enter your name.";
        return "";
      }
    },
    email: {
      el: document.getElementById("email"),
      error: document.getElementById("email-error"),
      check: function (value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address.";
        return "";
      }
    },
    message: {
      el: document.getElementById("message"),
      error: document.getElementById("message-error"),
      check: function (value) {
        if (value.trim().length < 10) return "Message should be at least 10 characters.";
        return "";
      }
    }
  };

  function validateField(field) {
    const message = field.check(field.el.value);
    field.error.textContent = message;
    field.el.classList.toggle("is-invalid", Boolean(message));
    field.el.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  Object.keys(fields).forEach(function (key) {
    fields[key].el.addEventListener("input", function () {
      if (fields[key].error.textContent) validateField(fields[key]);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    let ok = true;
    Object.keys(fields).forEach(function (key) {
      if (!validateField(fields[key])) ok = false;
    });
    if (!ok) return;

    const name = fields.name.el.value.trim();
    const email = fields.email.el.value.trim();
    const message = fields.message.el.value.trim();
    const body = "Name: " + name + "\nEmail: " + email + "\n\n" + message;

    mailtoLink.href = "mailto:adishbhat234@gmail.com?subject="
      + encodeURIComponent("Portfolio note from " + name)
      + "&body=" + encodeURIComponent(body);

    form.hidden = true;
    success.hidden = false;
  });

  resetButton.addEventListener("click", function () {
    form.reset();
    Object.keys(fields).forEach(function (key) {
      fields[key].error.textContent = "";
      fields[key].el.classList.remove("is-invalid");
      fields[key].el.removeAttribute("aria-invalid");
    });
    success.hidden = true;
    form.hidden = false;
    fields.name.el.focus();
  });
})();
