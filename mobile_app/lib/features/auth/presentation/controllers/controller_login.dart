import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../../core/red/resultado.dart';
import '../../domain/repositorio_auth.dart';
import '../../domain/resultado_login.dart';
import '../estado/estado_login.dart';

/// Controller del inicio de sesión. Recibe acciones de la UI y actualiza el
/// [EstadoLogin] que la pantalla observa.
class ControllerLogin extends Notifier<EstadoLogin> {
  late final RepositorioAuth _repositorio;

  @override
  EstadoLogin build() {
    _repositorio = sl<RepositorioAuth>();
    return const EstadoLogin.inicial();
  }

  Future<void> iniciarSesion({required String email, required String password}) async {
    state = const EstadoLogin.cargando();
    final Resultado<ResultadoLogin> resultado = await _repositorio.iniciarSesion(
      email: email.trim(),
      password: password,
    );
    state = switch (resultado) {
      Exito<ResultadoLogin>(:final ResultadoLogin valor) => EstadoLogin.exito(valor),
      Fallo<ResultadoLogin>(:final excepcion) => EstadoLogin.error(excepcion.mensaje),
    };
  }

  void reiniciar() {
    state = const EstadoLogin.inicial();
  }
}

final NotifierProvider<ControllerLogin, EstadoLogin> controllerLoginProvider =
    NotifierProvider<ControllerLogin, EstadoLogin>(ControllerLogin.new);
