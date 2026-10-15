// ORIGEN Cultural — Trust Center beta summaries v1.2
// Public-facing summaries for the controlled beta.
// These summaries must remain aligned with the actually deployed product.
window.ORIGEN_TRUST = {
  version: 'v1.2',
  updated: '8 October 2026',
  status: 'BETA — pendiente de revisión jurídica especializada antes de apertura pública',
  contact: 'info.origencultural@gmail.com',
  sections: [
    {
      id: 'scope',
      title: 'Qué es ORIGEN en esta beta',
      body: [
        'ORIGEN Cultural es una red social cultural para descubrir, seguir y valorar cultura viva mediante perfiles, publicaciones, favoritos, seguimiento, Pasaporte Cultural, reclamaciones de perfiles y reportes.',
        'La beta no procesa pagos, reservas, payouts ni mensajería privada. Si estas funciones se activan en el futuro, se publicarán términos específicos antes de su uso.'
      ]
    },
    {
      id: 'terms',
      title: 'Términos de uso',
      body: [
        'Usa ORIGEN de forma legal, respetuosa y auténtica. No suplantes identidades, no publiques contenido que no tengas derecho a compartir y no uses la plataforma para fraude, acoso, amenazas, explotación, doxxing o spam.',
        'Los perfiles de referencia pueden existir con fines editoriales y deben estar claramente identificados como no reclamados hasta que una persona o entidad autorizada complete el proceso de reclamación.',
        'ORIGEN puede limitar visibilidad, retirar contenido o suspender cuentas cuando sea necesario para proteger a personas, comunidades, derechos culturales, propiedad intelectual o la seguridad de la plataforma.'
      ]
    },
    {
      id: 'privacy',
      title: 'Privacidad y datos',
      body: [
        'La beta utiliza Supabase para autenticación, base de datos y almacenamiento de archivos. Los datos de cuenta pueden incluir correo, nombre, perfil, publicaciones, interacciones, reclamaciones y reportes.',
        'En el navegador usamos almacenamiento local para preferencias como idioma y bienestar digital, y para funciones experimentales del Pasaporte Cultural y seguimiento de territorios durante la beta. La sesión de autenticación puede persistirse localmente mediante Supabase Auth.',
        'No vendemos datos personales a anunciantes. En esta beta no activamos publicidad ni analítica opcional de marketing.'
      ]
    },
    {
      id: 'privacy-requests',
      title: 'Solicitudes de privacidad y eliminación de cuenta',
      body: [
        'Durante la beta puedes solicitar acceso, corrección o eliminación de datos escribiendo a info.origencultural@gmail.com desde el correo asociado a tu cuenta. ORIGEN puede pedir información razonable para verificar identidad antes de actuar.',
        'La eliminación de cuenta se procesa de forma controlada para retirar primero archivos propios de Storage y revisar cualquier perfil cultural vinculado antes de eliminar la cuenta de autenticación. No publiques datos personales, documentos de identidad ni evidencia sensible en GitHub o canales públicos.',
        'Algunos registros pueden conservarse únicamente cuando exista una razón legítima o una obligación aplicable, por ejemplo seguridad, prevención de fraude, resolución de disputas o cumplimiento legal. El alcance y los plazos definitivos serán revisados jurídicamente antes de la apertura pública.'
      ]
    },
    {
      id: 'cookies',
      title: 'Cookies y almacenamiento',
      body: [
        'ORIGEN usa únicamente tecnologías necesarias para que la cuenta y la experiencia funcionen. Supabase puede mantener la sesión de autenticación en el navegador.',
        'El service worker puede usar Cache Storage del navegador para archivos estáticos y mejorar rendimiento/disponibilidad. También cargamos librerías y recursos técnicos mediante jsDelivr para funciones como el globo cultural. No activaremos cookies de publicidad o analítica opcional sin revisar consentimiento, documentación e inventario técnico.'
      ]
    },
    {
      id: 'community',
      title: 'Comunidad y seguridad',
      body: [
        'Publica contenido cultural, educativo y contextualizado. Respeta a las personas y comunidades representadas y obtén permiso cuando corresponda.',
        'No se permite odio, amenazas, acoso, explotación, suplantación, estafas, contenido sexual no consentido, abuso infantil, instrucciones dañinas, spam malicioso ni infracciones de propiedad intelectual.',
        'Los usuarios pueden reportar contenido o perfiles. Las decisiones de moderación deben permitir revisión o apelación proporcional cuando corresponda.'
      ]
    },
    {
      id: 'cultural-rights',
      title: 'Respeto y derechos culturales',
      body: [
        'La cultura no es contenido libre por defecto. No publiques conocimiento sagrado, restringido, confidencial o ceremonial si no tienes autoridad o permiso para hacerlo.',
        'ORIGEN distingue identidad verificada, formación profesional y autoridad cultural. Una insignia, universidad o verificación de cuenta no convierte automáticamente a una persona en autoridad cultural.'
      ]
    },
    {
      id: 'copyright',
      title: 'Copyright y solicitudes de retiro',
      body: [
        'Comparte fotografías, videos, textos, música y otros materiales únicamente si tienes los derechos o permisos necesarios.',
        'Si consideras que un contenido vulnera tus derechos, utiliza las herramientas de reporte o escribe al correo oficial de ORIGEN con información suficiente para identificar el material y tu relación con los derechos reclamados.'
      ]
    },
    {
      id: 'wellbeing',
      title: 'Bienestar digital',
      body: [
        'ORIGEN puede ofrecer recordatorios voluntarios de descanso. El objetivo es fomentar exploración cultural sin premiar el tiempo de pantalla por sí mismo.',
        'El Pasaporte Cultural puede usar colecciones, niveles, sellos y retos. El progreso no debe perderse porque una persona se tome días de descanso.'
      ]
    }
  ]
};
