/// Excepciones de dominio de la app. Encapsulan los errores esperados al
/// comunicarse con la API para presentarlos de forma clara al usuario.
sealed class ExcepcionApp implements Exception {
  const ExcepcionApp(this.mensaje);

  final String mensaje;

  @override
  String toString() => mensaje;
}

/// Error de red: sin conexión, timeout o el servidor no respondió.
final class ExcepcionRed extends ExcepcionApp {
  const ExcepcionRed([
    super.mensaje =
        'No se pudo conectar con el servidor. Revisa tu internet o espera unos segundos e inténtalo de nuevo.',
  ]);
}

/// El servidor respondió con un error controlado (4xx/5xx con mensaje).
final class ExcepcionServidor extends ExcepcionApp {
  const ExcepcionServidor(super.mensaje, {this.codigoEstado});

  final int? codigoEstado;
}

/// Las credenciales o la sesión no son válidas (401/403).
final class ExcepcionNoAutorizado extends ExcepcionApp {
  const ExcepcionNoAutorizado([
    super.mensaje = 'Tu sesión expiró. Vuelve a iniciar sesión.',
  ]);
}

/// Error inesperado no clasificado.
final class ExcepcionDesconocida extends ExcepcionApp {
  const ExcepcionDesconocida([
    super.mensaje = 'Algo salió mal. Inténtalo otra vez.',
  ]);
}
