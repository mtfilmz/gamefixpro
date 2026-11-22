/* Game Fix · ajustes del programa de Windows y Android.
   Corre dentro de la ventana antes que la app. La app es la misma de Lovable, sin cambios; esto solo
   arregla lo que un navegador hace solo y un programa instalado no:
   - apaga el modo sin conexión de la web (service worker): el programa ya trae todos sus archivos;
   - abre fuera del programa WhatsApp, mensajes de texto, correo, teléfono y páginas externas;
   - Android: "Compartir" manda la imagen del recibo con el menú Compartir del teléfono, y
     "Descargar" abre la ventana de guardar del teléfono;
   - Windows (si no hay menú Compartir): copia la imagen del recibo y la guarda en
     Documentos › Game Fix › Recibos; la app muestra WhatsApp, mensaje y correo para enviarla. */
(function () {
  'use strict';
  if (window.__gamefixNativo) return;
  window.__gamefixNativo = true;

  var esAndroid = /Android/i.test(navigator.userAgent);

  // 1. Sin service worker: la app no se registra como página sin conexión dentro del programa.
  try { delete Navigator.prototype.serviceWorker; } catch (e) { /* no se pudo quitar */ }
  if ('serviceWorker' in navigator) {
    try { Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true }); } catch (e) { /* sin cambio */ }
  }

  function invoke(cmd, args) {
    return window.__TAURI_INTERNALS__.invoke(cmd, args || {});
  }

  function aviso(texto) {
    if (!texto || !document.body) return;
    var el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.textContent = texto;
    el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;' +
      'max-width:min(92vw,560px);background:#111827;color:#fff;padding:12px 16px;border-radius:10px;' +
      'font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 8000);
  }

  function abrirFuera(url) {
    return invoke('plugin:opener|open_url', { url: url }).catch(function (e) {
      console.error('No se pudo abrir', url, e);
      aviso('No se pudo abrir ese enlace.');
    });
  }

  // ¿Esta dirección sale del programa? (WhatsApp, sms:, mailto:, tel:, otra página web)
  function esExterna(href) {
    var u;
    try { u = new URL(href, location.href); } catch (e) { return false; }
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.origin !== location.origin;
    return ['blob:', 'data:', 'javascript:', 'about:'].indexOf(u.protocol) === -1;
  }

  // Android: el visor web no descarga archivos; se guarda con la ventana de guardar del teléfono.
  function guardarEnTelefono(href, nombre) {
    var T = window.__TAURI__;
    return fetch(href).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
      return T.dialog.save({ defaultPath: nombre || 'archivo' }).then(function (ruta) {
        if (!ruta) return;
        return T.fs.writeFile(ruta, new Uint8Array(buf)).then(function () { aviso('Imagen guardada.'); });
      });
    }).catch(function (e) {
      console.error('No se pudo guardar', e);
      aviso('No se pudo guardar el archivo.');
    });
  }
  function esDescargaLocal(a) {
    return a.hasAttribute('download') && /^(blob|data):/.test(a.href);
  }
  if (esAndroid) {
    var clicOriginal = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (esDescargaLocal(this)) { guardarEnTelefono(this.href, this.getAttribute('download')); return; }
      return clicOriginal.apply(this, arguments);
    };
  }

  // 2. Enlaces: los externos (o con target=_blank) se abren con la app del sistema.
  document.addEventListener('click', function (ev) {
    if (ev.defaultPrevented || ev.button !== 0) return;
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    if (a.hasAttribute('download')) {
      if (esAndroid && esDescargaLocal(a)) { ev.preventDefault(); guardarEnTelefono(a.href, a.getAttribute('download')); }
      return;
    }
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (!esExterna(a.href)) return;
    ev.preventDefault();
    abrirFuera(a.href);
  }, true);

  var abrirVentana = window.open;
  window.open = function (url) {
    if (url && esExterna(String(url))) {
      abrirFuera(new URL(String(url), location.href).href);
      return null;
    }
    return abrirVentana.apply(window, arguments);
  };

  function base64(buf) {
    var bytes = new Uint8Array(buf), s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(s);
  }

  function definir(nombre, fn) {
    try { Object.defineProperty(navigator, nombre, { value: fn, configurable: true, writable: true }); }
    catch (e) { navigator[nombre] = fn; }
  }

  function esImagen(data) {
    var f = data && data.files && data.files[0];
    return !!(f && /^image\//.test(f.type || ''));
  }

  // 3. Compartir la imagen del recibo.
  if (esAndroid) {
    // Android: el visor web no trae "Compartir"; se usa el menú Compartir del teléfono con la imagen.
    definir('canShare', function (data) { return esImagen(data); });
    definir('share', function (data) {
      if (!esImagen(data)) {
        // Solo texto: la app muestra WhatsApp, mensaje y correo.
        return Promise.reject(new Error('Comparte con las opciones de la app'));
      }
      var f = data.files[0];
      var texto = [data.text, data.url].filter(Boolean).join('\n');
      return f.arrayBuffer().then(function (buf) {
        return invoke('archivo_temporal', { nombre: f.name || 'recibo.png', contenidoB64: base64(buf) });
      }).then(function (ruta) {
        return invoke('plugin:compartir|share_file', {
          path: ruta, mimeType: f.type || 'image/png', title: data.title || 'Compartir recibo', text: texto
        });
      });
    });
  } else if (!navigator.share) {
    // Windows sin menú Compartir: copia la imagen y la guarda; luego la app muestra cómo enviarla.
    definir('canShare', function (data) { return esImagen(data); });
    definir('share', function (data) {
      if (!esImagen(data)) return Promise.reject(new Error('Comparte con las opciones de la app'));
      var f = data.files[0];
      var copiada = (navigator.clipboard && window.ClipboardItem && f.type === 'image/png')
        ? navigator.clipboard.write([new ClipboardItem({ 'image/png': f })]).then(function () { return true; }, function () { return false; })
        : Promise.resolve(false);
      var guardada = f.arrayBuffer().then(function (buf) {
        return invoke('guardar_binario', { carpeta: 'Recibos', nombre: f.name || 'recibo.png', contenidoB64: base64(buf) });
      }).catch(function () { return ''; });
      return Promise.all([copiada, guardada]).then(function (r) {
        aviso((r[0] ? 'Imagen del recibo copiada: pégala con Ctrl+V en WhatsApp o en el mensaje. ' : '') +
          (r[1] ? 'También quedó guardada en ' + r[1] : ''));
        // Error a propósito: la app muestra sus opciones (WhatsApp, mensaje de texto, correo).
        throw new Error('Comparte con las opciones de la app');
      });
    });
  }
})();
