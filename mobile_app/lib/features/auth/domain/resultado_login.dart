/// Resultado del primer paso de autenticación (correo + contraseña). Determina
/// qué necesita el usuario a continuación para completar el 2FA.
sealed class ResultadoLogin {
  const ResultadoLogin({required this.tempToken, required this.email});

  final String tempToken;
  final String email;
}

/// El usuario ya tiene 2FA configurado: solo debe ingresar el código.
final class MfaPendiente extends ResultadoLogin {
  const MfaPendiente({required super.tempToken, required super.email});
}

/// El usuario aún no configuró 2FA: debe escanear el QR y luego ingresar el código.
final class ConfiguracionTotpRequerida extends ResultadoLogin {
  const ConfiguracionTotpRequerida({
    required super.tempToken,
    required super.email,
    required this.secret,
    required this.qrCodeUri,
  });

  final String secret;
  final String qrCodeUri;
}
