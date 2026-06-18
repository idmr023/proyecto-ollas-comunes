import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../../core/red/resultado.dart';
import '../../domain/entidades/usuario.dart';
import '../../domain/repositorio_auth.dart';
import '../estado/estado_verificacion.dart';

/// Controller de la verificación del código TOTP (segundo factor).
class ControllerVerificacion extends Notifier<EstadoVerificacion> {
  late final RepositorioAuth _repositorio;

  @override
  EstadoVerificacion build() {
    _repositorio = sl<RepositorioAuth>();
    return const EstadoVerificacion.inicial();
  }

  Future<void> verificarCodigo({
    required String email,
    required String tempToken,
    required String codigo,
  }) async {
    state = const EstadoVerificacion.cargando();
    final Resultado<Usuario> resultado = await _repositorio.verificarCodigo(
      email: email,
      tempToken: tempToken,
      codigo: codigo,
    );
    state = switch (resultado) {
      Exito<Usuario>(:final Usuario valor) => EstadoVerificacion.exito(valor),
      Fallo<Usuario>(:final excepcion) => EstadoVerificacion.error(excepcion.mensaje),
    };
  }

  void reiniciar() {
    state = const EstadoVerificacion.inicial();
  }
}

final NotifierProvider<ControllerVerificacion, EstadoVerificacion> controllerVerificacionProvider =
    NotifierProvider<ControllerVerificacion, EstadoVerificacion>(ControllerVerificacion.new);
