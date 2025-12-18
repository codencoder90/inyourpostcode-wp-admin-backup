(function ($) {
  "use strict";

  if (typeof SMJ_DESIGN === "undefined") return;

  const ajaxUrl = SMJ_DESIGN.ajax_url;
  const nonce = SMJ_DESIGN.nonce;
  const productId = parseInt(SMJ_DESIGN.product_id || 0, 10);
  const cartUrl = SMJ_DESIGN.cart_url || "/cart";

  // use full incoming array but only pick exactly how many exist (1 or up to 2)
  const allImages = Array.isArray(SMJ_DESIGN.product_images) ? SMJ_DESIGN.product_images : [];
  const productImages = allImages.length === 1 ? allImages : allImages.slice(0, 2);

  let logoImage = null;
  let positions = [];
  let activeIndex = 0;

  const modal = $("#smj-designer-modal"),
        openBtn = $(".smj-design-open");

  function buildUI() {
    const thumbs = modal.find(".smj-thumbs").empty();
    productImages.forEach((src, i) => {
      thumbs.append(`<img class="smj-thumb" data-index="${i}" src="${src}">`);
    });

    const area = modal.find(".smj-canvas-area").empty();
    productImages.forEach((src, i) => {
      const wrap = $(`<div class="smj-wrap" data-index="${i}"></div>`);
      const base = $(`<img class="smj-base" src="${src}" alt="base-${i}">`);
      const holder = $('<div class="smj-overlay-holder"></div>');
      wrap.append(base).append(holder);
      area.append(wrap);
      if (!positions[i]) positions[i] = { xP: 0.5, yP: 0.5, wP: 0.2 };
    });

    // if user opens and there are no productImages, show nothing
    updatePreview();
  }

  openBtn.on("click", function (e) {
    e.preventDefault();
    buildUI();
    modal.attr("aria-hidden", "false").show();
  });

  modal.find(".smj-close").on("click", function () {
    modal.attr("aria-hidden", "true").hide();
  });

  modal.on("click", ".smj-thumb", function () {
    activeIndex = parseInt($(this).data("index"), 10);
    modal.find(".smj-thumb").css("outline", "none");
    $(this).css("outline", "3px solid rgba(0,150,136,0.2)");
  });

  $("#smj-logo-file").on("change", function () {
    const file = this.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      const img = new Image();
      img.onload = function () {
        logoImage = img;
        modal.find(".smj-wrap").each(function () {
          const idx = parseInt($(this).data("index"), 10);
          const holder = $(this).find(".smj-overlay-holder").empty();
          const logoEl = $(`<img class="smj-logo" src="${evt.target.result}">`);
          const sizePct = positions[idx]?.wP || 0.2;
          logoEl.css({
            width: (sizePct * 100) + "%",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            position: "absolute"
          });
          holder.append(logoEl);
          makeDraggable(logoEl[0], idx, this);
        });
        updatePreview();
        modal.find("#smj-scale").val(Math.round((positions[activeIndex]?.wP || 0.2) * 100));
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });

  modal.on("input", "#smj-scale", function () {
    const val = Math.max(5, Math.min(200, parseInt(this.value, 10))) / 100;
    positions[activeIndex].wP = val;
    const logo = $(`.smj-wrap[data-index="${activeIndex}"] .smj-logo`);
    logo.css({ width: (val * 100) + "%" });
    updatePreview();
  });

  function makeDraggable(el, idx, wrap) {
    let dragging = false, startX, startY, rect;
    el.addEventListener("pointerdown", function (e) {
      dragging = true;
      rect = wrap.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      el.setPointerCapture(e.pointerId);
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      const cur = positions[idx] || { xP: 0.5, yP: 0.5 };
      const newX = Math.min(1, Math.max(0, cur.xP + dx / rect.width));
      const newY = Math.min(1, Math.max(0, cur.yP + dy / rect.height));
      positions[idx] = { ...cur, xP: newX, yP: newY, wP: positions[idx].wP };
      $(el).css({ left: (newX * 100) + "%", top: (newY * 100) + "%" });
      startX = e.clientX; startY = e.clientY;
      rect = wrap.getBoundingClientRect();
      updatePreview();
    });
    window.addEventListener("pointerup", function () { dragging = false; });
  }

  function updatePreview() {
    const idx = activeIndex;
    const wrap = $(`.smj-wrap[data-index="${idx}"]`)[0];
    if (!wrap) return;
    const base = wrap.querySelector(".smj-base");
    const logo = wrap.querySelector(".smj-logo");
    if (!base) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 800; canvas.height = 600;
    const baseImg = new Image();
    baseImg.onload = function () {
      ctx.drawImage(baseImg, 0, 0, 800, 600);
      if (logo && logo.src) {
        const logoImg = new Image();
        logoImg.onload = function () {
          const p = positions[idx] || { xP: 0.5, yP: 0.5, wP: 0.2 };
          const w = 800 * p.wP;
          const h = w * (logoImg.naturalHeight / logoImg.naturalWidth);
          ctx.drawImage(logoImg, 800 * p.xP - w / 2, 600 * p.yP - h / 2, w, h);
          $("#smj-preview-img").attr("src", canvas.toDataURL("image/png"));
        };
        logoImg.src = logo.src;
      } else {
        $("#smj-preview-img").attr("src", canvas.toDataURL("image/png"));
      }
    };
    baseImg.src = base.src;
  }

  // --- Choose design and save final images + add to cart ---
  modal.on("click", "#smj-choose", async function (e) {
    e.preventDefault();
    const payload = [];

    // For each displayed base build final merged image (wait for images to load)
    for (const wrap of modal.find(".smj-wrap").toArray()) {
      const $wrap = $(wrap);
      const base = $wrap.find(".smj-base").attr("src") || "";
      const logo = $wrap.find(".smj-logo").attr("src") || "";
      const idx = $wrap.data("index");
      const pos = positions[idx] || { xP: 0.5, yP: 0.5, wP: 0.2 };

      const final = await new Promise((resolve) => {
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        c.width = 800; c.height = 600;
        const b = new Image();
        const l = new Image();
        b.onload = function () {
          ctx.drawImage(b, 0, 0, c.width, c.height);
          if (logo && logo.startsWith("data")) {
            l.onload = function () {
              const w = c.width * pos.wP;
              const h = w * (l.naturalHeight / l.naturalWidth);
              ctx.drawImage(l, c.width * pos.xP - w / 2, c.height * pos.yP - h / 2, w, h);
              resolve(c.toDataURL("image/png"));
            };
            l.src = logo;
          } else {
            resolve(c.toDataURL("image/png"));
          }
        };
        // if base is empty fallback to blank image (resolve quickly)
        b.onerror = function(){ resolve(c.toDataURL("image/png")); };
        if (base) b.src = base; else { /* blank */ resolve(c.toDataURL("image/png")); }
      });

      payload.push({ base, logo, position: pos, final });
    }

    const $btn = $(this).prop("disabled", true).text("Saving...");

    // Save data to server session
    $.post(ajaxUrl, {
      action: "smj_save_design",
      nonce: nonce,
      product_id: productId,
      images: JSON.stringify(payload)
    }).done(function (res) {
      if (res?.success) {
        // Now add product to cart via WooCommerce AJAX (session is preserved server-side)
        if (typeof wc_add_to_cart_params !== "undefined" && wc_add_to_cart_params.wc_ajax_url) {
          $.post(wc_add_to_cart_params.wc_ajax_url.replace("%%endpoint%%", "add_to_cart"), {
            product_id: productId,
            quantity: 1
          }).done(function () {
            // redirect to cart
            window.location.href = cartUrl;
          }).fail(function () {
            alert("Failed to add to cart. Please refresh and retry.");
          });
        } else {
          // fallback: use simple GET add-to-cart redirect
          window.location.href = "?add-to-cart=" + productId;
        }
      } else {
        alert("Save failed: " + (res?.data?.msg || "server error"));
        console.error(res);
      }
    }).fail(function () {
      alert("Error saving design. See console.");
    }).always(function () {
      $btn.prop("disabled", false).text("Choose This Design");
    });
  });

  $(document).ready(function () {
    if (modal.length) buildUI();
  });

})(jQuery);