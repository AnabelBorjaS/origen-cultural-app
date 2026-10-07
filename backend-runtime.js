// ORIGEN Cultural — production trust/auth runtime
(() => {
  'use strict';

  const SB = window.ORIGEN_SUPABASE || null;
  const toast = (message, ms = 3500) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), ms);
  };

  async function submitReport(button) {
    if (!SB) {
      toast('El sistema seguro de reportes no está disponible en este momento.');
      return;
    }
    const { data: authData } = await SB.auth.getUser();
    const user = authData?.user;
    if (!user) {
      toast('Inicia sesión para enviar un reporte.');
      location.hash = '#login';
      return;
    }

    const card = button.closest('[data-pid]');
    const targetId = button.dataset.report || card?.dataset.pid || null;
    const reason = window.prompt('¿Cuál es el motivo del reporte? Describe el problema brevemente.');
    if (!reason?.trim()) return;
    const details = window.prompt('Puedes añadir detalles o contexto adicional (opcional).') || '';

    const { error } = await SB.from('moderation_reports').insert({
      reporter_user_id: user.id,
      target_type: 'post',
      target_id: targetId ? String(targetId) : null,
      reason: reason.trim().slice(0, 500),
      details: details.trim() ? details.trim().slice(0, 6000) : null,
    });

    if (error) {
      console.error('Reporte:', error);
      toast('No pudimos enviar el reporte. Inténtalo de nuevo.');
      return;
    }
    toast('Reporte recibido. Gracias por ayudarnos a cuidar ORIGEN.');
  }

  document.addEventListener('click', event => {
    const reportButton = event.target.closest('[data-report]');
    if (reportButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      submitReport(reportButton);
      return;
    }

    const forgot = event.target.closest('#origen-forgot-password');
    if (forgot) {
      event.preventDefault();
      const field = document.querySelector('#login-form input[name="email"]');
      const email = field?.value?.trim() || window.prompt('Escribe el correo de tu cuenta ORIGEN:')?.trim();
      if (!email || !SB) return;

      SB.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + location.pathname + '?recovery=1',
      }).then(({ error }) => {
        if (error) {
          console.error('Password recovery:', error);
          toast('No pudimos enviar el correo de recuperación.');
        } else {
          toast('Te enviamos un correo para restablecer tu contraseña.', 5000);
        }
      });
    }
  }, true);

  function ensureForgotPasswordLink() {
    const form = document.getElementById('login-form');
    if (!form || document.getElementById('origen-forgot-password')) return;
    const p = document.createElement('p');
    p.className = 'auth-alt';
    p.innerHTML = '<a href="#" id="origen-forgot-password">¿Olvidaste tu contraseña?</a>';
    form.insertAdjacentElement('afterend', p);
  }

  function openRecoveryDialog() {
    if (!SB || document.getElementById('origen-recovery-dialog')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'origen-recovery-dialog';
    dialog.className = 'modal';
    dialog.innerHTML = `
      <form class="modal-card" id="origen-recovery-form">
        <div class="modal-header">
          <div><p class="eyebrow">SEGURIDAD</p><h2>Nueva contraseña</h2></div>
        </div>
        <div class="form-field full">
          <label>Nueva contraseña</label>
          <input type="password" name="password" minlength="8" required autocomplete="new-password">
        </div>
        <div class="form-field full" style="margin-top:14px">
          <label>Confirmar contraseña</label>
          <input type="password" name="confirm" minlength="8" required autocomplete="new-password">
        </div>
        <button class="btn" type="submit" style="width:100%;margin-top:20px">Guardar nueva contraseña</button>
      </form>`;
    document.body.appendChild(dialog);
    dialog.showModal();

    dialog.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      const fd = Object.fromEntries(new FormData(event.currentTarget));
      if (fd.password !== fd.confirm) {
        toast('Las contraseñas no coinciden.');
        return;
      }
      const submit = event.currentTarget.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Guardando…';
      const { error } = await SB.auth.updateUser({ password: fd.password });
      if (error) {
        console.error('Update password:', error);
        submit.disabled = false;
        submit.textContent = 'Guardar nueva contraseña';
        toast('No pudimos actualizar la contraseña.');
        return;
      }
      dialog.close();
      dialog.remove();
      const clean = location.pathname + location.hash;
      history.replaceState({}, '', clean);
      toast('Contraseña actualizada correctamente.');
      location.hash = '#mi-perfil';
    });
  }

  const observer = new MutationObserver(() => ensureForgotPasswordLink());
  observer.observe(document.getElementById('main-content') || document.body, { childList: true, subtree: true });
  ensureForgotPasswordLink();

  if (SB) {
    SB.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') openRecoveryDialog();
    });
    if (new URLSearchParams(location.search).get('recovery') === '1') {
      setTimeout(async () => {
        const { data } = await SB.auth.getSession();
        if (data?.session) openRecoveryDialog();
      }, 500);
    }
  }
})();
