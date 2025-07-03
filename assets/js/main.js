let modalSwiperInstance;
let shouldResetOnClose = true;

function clearFilterState() {
  const inputs = document.querySelectorAll("#filterModal .filter__input input");
  inputs.forEach((input) => (input.value = ""));

  const sortOptions = document.querySelectorAll("#filterModal .sort");
  sortOptions.forEach((option) => option.classList.remove("active"));
}

class ModalSwiper {
  constructor({ windowSelector = ".fixed__window", wrapperSelector = ".fixed__wrapper", dragSelector = ".fixed__inner-line" } = {}) {
    this.overlay = document.querySelector(windowSelector);
    this.activeModal = null;
    this.wrapperSelector = wrapperSelector;
    this.dragSelector = dragSelector;

    if (this.overlay) {
      this.overlay.addEventListener("click", () => this.closeActiveModal());
    }

    this.initAll();
  }

  initAll() {
    this.setupOpeners();
    this.initAllSwipes();
  }

  setupOpeners() {
    document.querySelectorAll("[data-modal-id]").forEach((button) => {
      const id = button.getAttribute("data-modal-id");
      button.addEventListener("click", () => this.toggleModal(id));
    });
  }

  toggleModal(id) {
    const modal = document.getElementById(id);
    if (!modal || !this.overlay) return;

    const isOpen = modal.classList.contains("active");
    this.closeActiveModal();

    if (!isOpen) {
      modal.classList.add("active");
      this.overlay.classList.add("active");
      this.activeModal = modal;
    }
  }

  closeActiveModal() {
    if (!this.activeModal) {
      this.overlay?.classList.remove("active");
      return;
    }

    const modal = this.activeModal;
    modal.style.transition = "transform 0.3s ease";
    modal.style.transform = "translateY(100%) translateX(-50%)";

    const onTransitionEnd = () => {
      modal.classList.remove("active");
      modal.style.transform = "translateX(-50%)";
      modal.style.transition = "";
      modal.removeEventListener("transitionend", onTransitionEnd);
      this.activeModal = null;

      if (shouldResetOnClose) clearFilterState();
      shouldResetOnClose = true;
    };

    modal.addEventListener("transitionend", onTransitionEnd);
    this.overlay?.classList.remove("active");
  }

  initAllSwipes() {
    document.querySelectorAll(`${this.wrapperSelector}[id]`).forEach((wrapper) => {
      const id = wrapper.id;
      this.initSwipe(id);
    });
  }

  initSwipe(modalId) {
    const wrapper = document.getElementById(modalId);
    const dragHandle = wrapper?.querySelector(this.dragSelector);
    if (!wrapper || !dragHandle) return;

    let isDragging = false;
    let startY = 0;
    let deltaY = 0;

    const startDrag = (y) => {
      isDragging = true;
      startY = y;
      deltaY = 0;
      wrapper.style.transition = "none";
      wrapper.style.willChange = "transform";
    };

    const moveDrag = (y) => {
      if (!isDragging) return;
      deltaY = Math.max(0, y - startY);
      wrapper.style.transform = `translateY(${deltaY}px) translateX(-50%)`;
    };

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      wrapper.style.transition = "transform 0.3s ease, bottom 0.3s ease";

      const threshold = wrapper.offsetHeight * 0.3;
      if (deltaY > threshold) {
        this.closeActiveModal();
      } else {
        wrapper.style.transform = "translateY(0) translateX(-50%)";
      }
      deltaY = 0;
    };

    dragHandle.addEventListener("touchstart", (e) => startDrag(e.touches[0].clientY));
    dragHandle.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        moveDrag(e.touches[0].clientY);
      },
      { passive: false }
    );
    dragHandle.addEventListener("touchend", endDrag);
    dragHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startDrag(e.clientY);
    });
    window.addEventListener("mousemove", (e) => {
      if (isDragging) moveDrag(e.clientY);
    });
    window.addEventListener("mouseup", endDrag);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  modalSwiperInstance = new ModalSwiper();

  const filter = document.querySelector(".filter");
  const filterInner = document.querySelector(".filter__inner");
  const filterModal = document.getElementById("filterModal");
  const sortOptions = document.querySelectorAll(".fixed__inner-sort .sort");
  const saveButton = document.querySelector(".fixed__inner-bottom .button.center");
  const resetButton = document.querySelector(".fixed__inner-bottom .button__gray");
  const itemsWrapper = document.getElementById("itemsWrapper");
  const searchInput = document.getElementById("filterInput");
  if (!filterModal || !itemsWrapper || !filter || !filterInner) return;
  const originalItems = [...itemsWrapper.querySelectorAll(".item")];

  function updateItemDisplay() {
    const searchValue = searchInput.value.trim().toLowerCase();
    const items = [...itemsWrapper.querySelectorAll(".item")];

    const priceInputs = filterModal.querySelectorAll(".filter__input input");
    const priceFrom = parseFloat(priceInputs[0].value.trim()) || null;
    const priceTo = parseFloat(priceInputs[1].value.trim()) || null;

    items.forEach((item) => {
      const idText = item.querySelector(".item__number")?.textContent.toLowerCase() || "";
      const priceText = item.querySelector(".item__button span")?.textContent || "";
      const price = parseFloat(priceText);

      let visible = true;

      if (searchValue && !idText.includes(searchValue)) visible = false;
      if (priceFrom !== null && price < priceFrom) visible = false;
      if (priceTo !== null && price > priceTo) visible = false;

      item.style.display = visible ? "" : "none";
    });
  }

  function sortItems(order = "relevant") {
    const items = [...itemsWrapper.querySelectorAll(".item")];

    if (order === "low") {
      items.sort((a, b) => parseFloat(a.querySelector(".item__button span").textContent) - parseFloat(b.querySelector(".item__button span").textContent));
    } else if (order === "high") {
      items.sort((a, b) => parseFloat(b.querySelector(".item__button span").textContent) - parseFloat(a.querySelector(".item__button span").textContent));
    } else {
      items.length = 0;
      originalItems.forEach((item) => itemsWrapper.appendChild(item));
      updateItemDisplay();
      return;
    }

    items.forEach((item) => itemsWrapper.appendChild(item));
  }

  function refreshItems() {
    const activeSort = document.querySelector(".sort.active span")?.textContent.trim().toLowerCase();
    if (activeSort === "low to high") sortItems("low");
    else if (activeSort === "high to low") sortItems("high");
    else sortItems("relevant");

    updateItemDisplay();
  }

  sortOptions.forEach((option) => {
    option.addEventListener("click", () => {
      sortOptions.forEach((opt) => opt.classList.remove("active"));
      option.classList.add("active");

      refreshItems();
    });
  });

  function clearFilter() {
    filter.classList.add("hidden");
    filterInner.innerHTML = "";

    const inputs = filterModal.querySelectorAll("input");
    inputs.forEach((input) => (input.value = ""));

    sortOptions.forEach((option) => option.classList.remove("active"));

    shouldResetOnClose = false;
    modalSwiperInstance.closeActiveModal();

    sortItems("relevant");
    updateItemDisplay();
  }

  function applyFilter() {
    const priceInputs = filterModal.querySelectorAll(".filter__input input");
    const priceFrom = priceInputs[0].value.trim();
    const priceTo = priceInputs[1].value.trim();
    const activeSortElement = filterModal.querySelector(".sort.active span");
    const activeSort = activeSortElement ? activeSortElement.textContent : "";

    filterInner.innerHTML = "";

    if (activeSort || priceFrom || priceTo) {
      const clearBtn = document.createElement("button");
      clearBtn.className = "button filter__clear";
      clearBtn.id = "clearFilter";
      clearBtn.textContent = "Clear filter";
      filterInner.appendChild(clearBtn);

      if (activeSort) {
        const sortBadge = document.createElement("div");
        sortBadge.className = "filter__badge";
        sortBadge.innerHTML = `<span>Sort: ${activeSort}</span><svg><use xlink:href="assets/img/icon.svg#xmark"></use></svg>`;
        filterInner.appendChild(sortBadge);
      }

      if (priceFrom || priceTo) {
        const priceBadge = document.createElement("div");
        priceBadge.className = "filter__badge";
        priceBadge.innerHTML = `<span>Price: ${priceFrom || "Min"} to ${priceTo || "Max"}</span><svg><use xlink:href="assets/img/icon.svg#xmark"></use></svg>`;
        filterInner.appendChild(priceBadge);
      }

      filter.classList.remove("hidden");
      document.getElementById("clearFilter").addEventListener("click", clearFilter);
    } else {
      filter.classList.add("hidden");
    }

    shouldResetOnClose = false;
    modalSwiperInstance.closeActiveModal();

    filterInner.querySelectorAll(".filter__badge svg").forEach((svg) => {
      svg.addEventListener("click", (e) => {
        const badge = e.currentTarget.closest(".filter__badge");
        if (!badge) return;

        const text = badge.querySelector("span")?.textContent || "";

        if (text.startsWith("Sort:")) {
          sortOptions.forEach((opt) => opt.classList.remove("active"));
        }

        if (text.startsWith("Price:")) {
          const inputs = filterModal.querySelectorAll(".filter__input input");
          inputs.forEach((input) => (input.value = ""));
        }

        badge.remove();

        const remaining = filterInner.querySelectorAll(".filter__badge");
        if (remaining.length === 0) {
          filter.classList.add("hidden");
        }

        refreshItems();
      });
    });

    refreshItems();
  }

  if (searchInput) {
    searchInput.addEventListener("input", updateItemDisplay);
  }
  saveButton.addEventListener("click", applyFilter);
  resetButton.addEventListener("click", clearFilter);
});

const input = document.getElementById("withdrawInput");

const updateInputWidth = () => {
  const value = input.value || input.placeholder;

  const span = document.createElement("span");
  const styles = getComputedStyle(input);

  span.style.visibility = "hidden";
  span.style.position = "absolute";
  span.style.whiteSpace = "pre";

  span.style.font = styles.font;
  span.style.fontSize = styles.fontSize;
  span.style.letterSpacing = styles.letterSpacing;
  span.style.fontWeight = styles.fontWeight;
  span.style.fontFamily = styles.fontFamily;

  const safeValue = /[.,]$/.test(value) ? value + "\u200B" : value;
  span.textContent = safeValue;

  document.body.appendChild(span);
  const width = span.offsetWidth + 10;
  input.style.width = width + "px";
  span.remove();
};

if (input) {
  input.addEventListener("input", () => {
    let raw = input.value;

    raw = raw.replace(/,/g, ".");

    raw = raw.replace(/[^0-9.]/g, "");

    const parts = raw.split(".");
    if (parts.length > 2) {
      raw = parts[0] + "." + parts.slice(1).join("");
    }

    input.value = raw;
    updateInputWidth();
  });

  input.addEventListener("beforeinput", (e) => {
    if (e.inputType === "insertText" && !/[\d.,]/.test(e.data)) {
      e.preventDefault();
    }
  });
}

const FormControl = (() => {
  const inputButtonMap = new Map();
  let resetTimers = new Map();

  function initForm(inputSelector, buttonSelector, pageId) {
    const input = document.querySelector(inputSelector);
    const button = document.querySelector(buttonSelector);
    const profileClassEl = document.querySelector("#profileClass");
    if (!input || !button) return;

    inputButtonMap.set(pageId, { input, button });

    const onInput = () => {
      const value = input.value.trim().replace(",", ".");
      const isValid = value !== "" && !isNaN(value) && parseFloat(value) > 0;
      button.disabled = !isValid;

      if (pageId === "withdraw") {
        switchBlur(isValid ? "blur__blue" : "blur__white");

        const withdrawSumEl = document.getElementById("withdrawSum");
        if (withdrawSumEl) {
          withdrawSumEl.textContent = isValid ? value : "0";
        }

        if (profileClassEl) {
          if (value === "") {
            profileClassEl.classList.remove("blue");
          } else {
            profileClassEl.classList.add("blue");
          }
        }
      }
    };

    input.addEventListener("input", onInput);
    button.disabled = true;

    onInput();
  }

  function resetForm(pageId, delay = 0) {
    const pair = inputButtonMap.get(pageId);
    if (!pair) return;

    if (resetTimers.has(pageId)) {
      clearTimeout(resetTimers.get(pageId));
    }

    const timer = setTimeout(() => {
      pair.input.value = "";
      pair.button.disabled = true;

      resetTimers.delete(pageId);
    }, delay);
    if (pageId === "withdraw") {
      const errorBlock = document.getElementById("withdrawError");
      if (errorBlock) errorBlock.classList.add("hidden");
    }
    resetTimers.set(pageId, timer);
  }

  return {
    register: initForm,
    reset: resetForm,
  };
})();

let activePage = "home";
let pageHistory = [];
let lastVisitedPage = null;

let selectedItem = null;

function goTo(pageId) {
  if (pageId === "back") {
    if (pageHistory.length > 0) {
      const previous = pageHistory.pop();
      goTo(previous);
    }
    return;
  }

  if (pageId !== activePage) {
    pageHistory.push(activePage);
    lastVisitedPage = activePage;
    activePage = pageId;
  }

  document.querySelectorAll(".item.active").forEach((el) => el.classList.remove("active"));
  selectedItem = null;

  document.querySelectorAll(".wrapper").forEach((w) => w.classList.remove("active"));

  const targetWrapper = document.getElementById(pageId);
  if (targetWrapper) targetWrapper.classList.add("active");

  const phoneInput = document.querySelector(".withdrawPhone");
  const errorBlock = document.querySelector(".phone__error");
  if (phoneInput) phoneInput.value = "";
  if (errorBlock) errorBlock.classList.add("hidden");

  if (lastVisitedPage) {
    FormControl.reset(lastVisitedPage, 300);
    const selectButtons = document.querySelectorAll("#selectWrapper button");
    selectButtons.forEach((btn) => btn.classList.remove("active"));
    updateInputWidth();
  }
  if (pageId === "home") {
    switchBlur("");
    return;
  }
  if (pageId === "profile") {
    switchBlur("blur__blue");
    return;
  }
  if (pageId === "withdraw") {
    switchBlur("blur__white");
    requestAnimationFrame(() => {
      FormControl.register("#withdrawInput", "#withdrawButton", "withdraw");
    });
    return;
  }

  if (pageId === "withdrawSelect") {
    switchBlur("blur__white");
    const button = document.getElementById("withdrawSelectButton");
    const items = document.querySelectorAll("#withdrawSelectList .item");
    const handleSelection = () => {
      const anySelected = document.querySelector("#withdrawSelectList .item.active");
      button.disabled = !anySelected;
    };

    items.forEach((item) => {
      item.addEventListener("click", () => {
        items.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        selectedItem = item.getAttribute("data-target");
        handleSelection();
        switchBlur("blur__blue");
      });
    });

    handleSelection();
    return;
  }

  if (pageId === "withdrawSbp") {
    switchBlur("");
    const button = document.getElementById("withdrawSbpButton");
    const items = document.querySelectorAll("#withdrawSbpList .item");

    const updateButtonState = () => {
      const hasSelection = document.querySelector("#withdrawSbpList .item.active");
      button.disabled = !hasSelection;
    };

    items.forEach((item) => {
      item.addEventListener("click", () => {
        items.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        updateButtonState();
      });
    });

    updateButtonState();
    return;
  }

  if (pageId === "withdrawCard") {
    switchBlur("");
    const button = document.getElementById("withdrawCardButton");
    const items = document.querySelectorAll("#withdrawCardList .item");

    const updateButtonState = () => {
      const hasSelection = document.querySelector("#withdrawCardList .item.active");
      button.disabled = !hasSelection;
    };

    items.forEach((item) => {
      item.addEventListener("click", () => {
        items.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        updateButtonState();
      });
    });

    updateButtonState();
    return;
  }

  if (pageId === "withdrawCardData") {
    switchBlur("");
    const button = document.getElementById("withdrawCardDataButton");
    const cardInput = document.getElementById("withdrawCardInput");
    const errorBlock = document.querySelector("#withdrawCardData .phone__error");

    const updateButtonState = () => {
      const value = cardInput?.value?.trim() || "";
      button.disabled = value === "";
    };

    if (cardInput) {
      cardInput.value = "";
      cardInput.addEventListener("input", updateButtonState);
      updateButtonState();
    }

    if (errorBlock) errorBlock.classList.add("hidden");

    return;
  }

  if (pageId === "withdrawWallet") {
    switchBlur("");
    const walletInput = document.getElementById("wallet");
    const walletButton = document.getElementById("withdrawWalletButton");
    const errorBlock = document.querySelector("#withdrawWallet .card__error");

    if (walletInput) {
      walletInput.value = "";
      walletInput.addEventListener("input", () => {
        walletButton.disabled = walletInput.value.trim().length === 0;
        if (errorBlock) errorBlock.classList.add("hidden");
      });
    }

    if (walletButton) {
      walletButton.disabled = true;
    }

    if (errorBlock) {
      errorBlock.classList.add("hidden");
    }

    return;
  }

  if (pageId === "withdrawCrypto") {
    switchBlur("");
    return;
  }

  if (pageId === "withdrawSuccess") {
    switchBlur("blur__green");
    return;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const withdrawButton = document.getElementById("withdrawButton");
  const withdrawInput = document.getElementById("withdrawInput");
  const errorBlock = document.getElementById("withdrawError");

  if (!withdrawButton || !withdrawInput || !errorBlock) return;

  withdrawButton.addEventListener("click", () => {
    const rawValue = withdrawInput.value.trim().replace(",", ".");
    const amount = parseFloat(rawValue);

    const isValid = !isNaN(amount) && amount > 0 && amount <= balance;

    if (isValid) {
      goTo("withdrawSelect");
      errorBlock.classList.add("hidden");
    } else {
      errorBlock.classList.remove("hidden");
      withdrawInput.focus();
      switchBlur("blur__red");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const walletInput = document.getElementById("wallet");
  const walletButton = document.getElementById("withdrawWalletButton");
  const errorBlock = document.querySelector("#withdrawWallet .card__error");

  if (walletInput && walletButton) {
    walletInput.addEventListener("input", () => {
      walletButton.disabled = walletInput.value.trim().length === 0;
      if (errorBlock) errorBlock.classList.add("hidden");
    });

    walletButton.addEventListener("click", () => {
      const value = walletInput.value.trim();
      if (value.length > 5) {
        goTo("withdrawSuccess");
      } else {
        if (errorBlock) errorBlock.classList.remove("hidden");
        walletInput.focus();
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const sbpButton = document.getElementById("withdrawSbpButton");
  const phoneInput = document.querySelector(".withdrawPhone");
  const errorBlock = document.querySelector(".phone__error");
  const cardButton = document.getElementById("withdrawCardButton");

  if (cardButton) {
    cardButton.addEventListener("click", () => {
      const hasActiveItem = document.querySelector("#withdrawCardList .item.active");

      if (hasActiveItem) {
        goTo("withdrawCardData");
      }
    });
  }
  if (sbpButton && phoneInput) {
    sbpButton.addEventListener("click", () => {
      const digits = phoneInput.value.replace(/\D/g, "");
      const isValid = digits.length === 11;

      if (isValid) {
        goTo("withdrawSuccess");
      } else {
        if (errorBlock) errorBlock.classList.remove("hidden");
        phoneInput.focus();
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const cardDataButton = document.getElementById("withdrawCardDataButton");
  const cardInput = document.getElementById("withdrawCardInput");
  const errorBlock = document.querySelector("#withdrawCardData .phone__error");

  const isCardValid = (value) => {
    const digits = value.replace(/\D/g, "");
    return /^\d{16}$/.test(digits);
  };

  if (cardInput && cardDataButton) {
    cardInput.addEventListener("input", () => {
      cardDataButton.disabled = cardInput.value.trim() === "";
    });

    cardDataButton.addEventListener("click", () => {
      const raw = cardInput.value || "";
      if (isCardValid(raw)) {
        goTo("withdrawSuccess");
      } else {
        errorBlock?.classList.remove("hidden");
        cardInput.focus();
      }
    });
  }
});

let currentBlurClass = "";

function switchBlur(colorClass) {
  const blur = document.querySelector(".blur");
  if (!blur) return;

  if (colorClass === currentBlurClass) return;

  blur.classList.remove("blur__white", "blur__blue", "blur__red", "blur__green");

  currentBlurClass = colorClass;

  if (!colorClass) return;

  void blur.offsetHeight;
  setTimeout(() => {
    blur.classList.add(colorClass);
  }, 100);
}

document.querySelector("#withdrawSelectButton").addEventListener("click", () => {
  if (!selectedItem) return;

  const selectedElem = document.querySelector(`[data-target="${selectedItem}"]`);
  const coin = selectedElem?.getAttribute("data-coin");

  if (selectedItem === "withdrawTon") {
    goTo("withdrawWallet");

    requestAnimationFrame(() => {
      const walletInput = document.getElementById("wallet");
      if (walletInput && coin) {
        walletInput.placeholder = `Введите ${coin}-адрес`;
      }
    });
    return;
  }

  goTo(selectedItem);
});

function formatPhoneStrict(input) {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  } else if (digits.startsWith("9") && digits.length <= 10) {
    digits = "7" + digits;
  }

  digits = digits.slice(0, 11);

  let formatted = "+7";
  if (digits.length > 1) formatted += " (" + digits.slice(1, 4);
  if (digits.length >= 4) formatted += ") " + digits.slice(4, 7);
  if (digits.length >= 7) formatted += "-" + digits.slice(7, 9);
  if (digits.length >= 9) formatted += "-" + digits.slice(9, 11);

  return formatted;
}

function formatCard(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function applyPhoneMask() {
  document.querySelectorAll(".withdrawPhone").forEach((input) => {
    input.setAttribute("type", "tel");

    let lastDigits = "";

    input.addEventListener("beforeinput", (e) => {
      if (e.inputType === "deleteContentBackward" || e.inputType === "deleteContentForward") {
        const raw = input.value.replace(/\D/g, "");
        lastDigits = raw;
      }
    });

    input.addEventListener("input", (e) => {
      const raw = input.value.replace(/\D/g, "");

      if (raw.length < lastDigits.length) {
        lastDigits = raw;
      }

      input.value = formatPhoneStrict(raw);
      input.setSelectionRange(input.value.length, input.value.length);
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text");
      input.value = formatPhoneStrict(text);
      input.setSelectionRange(input.value.length, input.value.length);
    });
  });
}

function applyCardMask() {
  document.querySelectorAll(".withdrawCard").forEach((input) => {
    input.setAttribute("type", "text");
    input.setAttribute("maxlength", "19");
    input.setAttribute("inputmode", "numeric");

    input.addEventListener("input", () => {
      input.value = formatCard(input.value);
      input.setSelectionRange(input.value.length, input.value.length);
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text");
      input.value = formatCard(text);
      input.setSelectionRange(input.value.length, input.value.length);
    });
  });
}

function applyPasteHandlers() {
  document.querySelectorAll(".filter__flex.paste").forEach((block) => {
    const button = block.querySelector(".pasteButton");
    const input = block.querySelector("input");

    button?.addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (input.classList.contains("withdrawPhone")) {
          input.value = formatPhoneStrict(text);
        } else if (input.classList.contains("withdrawCard")) {
          input.value = formatCard(text);
        }
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      } catch (err) {}
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyPhoneMask();
  applyCardMask();
  applyPasteHandlers();
});

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("withdrawCryptoInput");
  const items = document.querySelectorAll(".chain__inner .item");
  const badges = document.querySelectorAll(".chain__select .filter__badge");
  const walletInput = document.getElementById("wallet");

  let activeNetwork = "Все сети";

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    items.forEach((item) => {
      const name = item.querySelector(".item__flex")?.textContent.toLowerCase() || "";
      const network = item.querySelector(".item__flex span")?.textContent.trim() || "";

      const matchesSearch = name.includes(query);
      const matchesNetwork = activeNetwork === "Все сети" || network === activeNetwork;

      item.style.display = matchesSearch && matchesNetwork ? "" : "none";
    });
  });

  badges.forEach((badge) => {
    badge.addEventListener("click", () => {
      badges.forEach((b) => b.classList.remove("active"));
      badge.classList.add("active");

      activeNetwork = badge.textContent.trim();

      const query = searchInput.value.trim().toLowerCase();

      items.forEach((item) => {
        const name = item.querySelector(".item__flex")?.textContent.toLowerCase() || "";
        const network = item.querySelector(".item__flex span")?.textContent.trim() || "";

        const matchesSearch = name.includes(query);
        const matchesNetwork = activeNetwork === "Все сети" || network === activeNetwork;

        item.style.display = matchesSearch && matchesNetwork ? "" : "none";
      });
    });
  });

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const coinName = item.getAttribute("data-coin");
      if (walletInput && coinName) {
        walletInput.placeholder = `Введите ${coinName}-адрес`;
      }
      goTo("withdrawWallet");
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const walletInput = document.getElementById("wallet");
  const pasteBtn = document.getElementById("pasteButton");

  if (walletInput && pasteBtn) {
    pasteBtn.addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        walletInput.value = text;
        walletInput.focus();
        walletInput.setSelectionRange(walletInput.value.length, walletInput.value.length);
      } catch (err) {}
    });
  }
});

let balance = 5000;

document.addEventListener("DOMContentLoaded", () => {
  const selectWrapper = document.getElementById("selectWrapper");
  const withdrawInput = document.getElementById("withdrawInput");

  if (!selectWrapper || !withdrawInput) return;

  const buttons = selectWrapper.querySelectorAll("button");

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      let value = "";

      switch (index) {
        case 0:
          value = 1;
          break;
        case 1:
          value = balance * 0.25;
          break;
        case 2:
          value = balance * 0.5;
          break;
        case 3:
          value = balance;
          break;
      }

      withdrawInput.value = value;
      withdrawInput.dispatchEvent(new Event("input"));
    });
  });
});

window.addEventListener(
  "wheel",
  function (e) {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  },
  { passive: false }
);

window.addEventListener("keydown", function (e) {
  if (e.ctrlKey && (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "_")) {
    e.preventDefault();
  }
});

document.addEventListener("click", function (event) {
  const active = document.activeElement;

  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
    if (!active.contains(event.target)) {
      active.blur();
    }
  }
});
