/// Configuración de entorno de la app. La URL base de la API se inyecta en
/// tiempo de compilación con `--dart-define=APP_API_BASE_URL=...`.
///
/// Valores por defecto pensados para desarrollo:
/// - Emulador Android: `http://10.0.2.2:4000` (apunta al localhost del PC).
/// - Dispositivo físico: usar la IP de red del PC (ej. http://192.168.x.x:4000).
abstract final class Entorno {
  static const String urlBaseApi = String.fromEnvironment(
    'APP_API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000',
  );

  static const String prefijoApi = '/api';
}
