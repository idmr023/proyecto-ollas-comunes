import '../../../core/red/resultado.dart';
import 'entidades/usuario.dart';
import 'resultado_login.dart';

/// Contrato del repositorio de autenticación. Define las operaciones de
/// dominio sin acoplarse a la implementación concreta (HTTP/Supabase).
abstract interface class RepositorioAuth {
  /// Paso 1: valida correo y contraseña; devuelve qué se necesita para el 2FA.
  Future<Resultado<ResultadoLogin>> iniciarSesion({
    required String email,
    required String password,
  });

  /// Paso 2: verifica el código TOTP y persiste la sesión (JWT).
  Future<Resultado<Usuario>> verificarCodigo({
    required String email,
    required String tempToken,
    required String codigo,
  });

  /// Devuelve el usuario de la sesión activa.
  Future<Resultado<Usuario>> obtenerUsuarioActual();

  /// Indica si hay un token de sesión guardado.
  Future<bool> haySesionActiva();

  /// Cierra la sesión borrando el token.
  Future<void> cerrarSesion();
}
