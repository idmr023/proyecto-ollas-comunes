/// Configuración de entorno de la app. La URL base de la API se inyecta en
/// tiempo de compilación con `--dart-define=APP_API_BASE_URL=...`.
///
/// Por defecto apunta al backend en Render (mismo host que `GOOGLE_REDIRECT_URL`
/// en `backend/.env`). Para desarrollo local:
/// - Emulador Android: `--dart-define=APP_API_BASE_URL=http://10.0.2.2:4000`
/// - Dispositivo físico en la misma red: `--dart-define=APP_API_BASE_URL=http://192.168.x.x:4000`
abstract final class Entorno {
  static const String urlBaseApi = String.fromEnvironment(
    'APP_API_BASE_URL',
    defaultValue: 'https://proyecto-ollas-comunes.onrender.com',
  );

  static const String prefijoApi = '/api';
}
