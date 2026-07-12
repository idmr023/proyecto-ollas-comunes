import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../core/red/resultado.dart';
import '../../auth/domain/entidades/usuario.dart';
import '../../auth/domain/repositorio_auth.dart';

/// Provee el usuario de la sesión actual para la pantalla "Más".
final FutureProvider<Usuario?> usuarioActualProvider = FutureProvider<Usuario?>(
  (Ref ref) async {
    final Resultado<Usuario> resultado = await sl<RepositorioAuth>()
        .obtenerUsuarioActual();
    return resultado is Exito<Usuario> ? resultado.valor : null;
  },
);
