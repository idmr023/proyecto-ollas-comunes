import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../../core/red/resultado.dart';
import '../../../auth/domain/entidades/usuario.dart';
import '../../../auth/domain/repositorio_auth.dart';
import '../../domain/entidades/resumen_dashboard.dart';
import '../../domain/repositorio_dashboard.dart';
import '../estado/estado_dashboard.dart';

/// Controller del dashboard. Carga en paralelo el usuario y el resumen del día.
class ControllerDashboard extends Notifier<EstadoDashboard> {
  late final RepositorioAuth _repositorioAuth;
  late final RepositorioDashboard _repositorioDashboard;

  @override
  EstadoDashboard build() {
    _repositorioAuth = sl<RepositorioAuth>();
    _repositorioDashboard = sl<RepositorioDashboard>();
    return const EstadoDashboard.inicial();
  }

  Future<void> cargar() async {
    state = const EstadoDashboard.cargando();
    final List<dynamic> resultados = await Future.wait<dynamic>(<Future<dynamic>>[
      _repositorioAuth.obtenerUsuarioActual(),
      _repositorioDashboard.obtenerResumen(),
    ]);
    final Resultado<Usuario> resultadoUsuario = resultados[0] as Resultado<Usuario>;
    final Resultado<ResumenDashboard> resultadoResumen = resultados[1] as Resultado<ResumenDashboard>;
    if (resultadoUsuario is Fallo<Usuario>) {
      state = EstadoDashboard.error(resultadoUsuario.excepcion.mensaje);
      return;
    }
    if (resultadoResumen is Fallo<ResumenDashboard>) {
      state = EstadoDashboard.error(resultadoResumen.excepcion.mensaje);
      return;
    }
    state = EstadoDashboard.exito(
      (resultadoUsuario as Exito<Usuario>).valor,
      (resultadoResumen as Exito<ResumenDashboard>).valor,
    );
  }
}

final NotifierProvider<ControllerDashboard, EstadoDashboard> controllerDashboardProvider =
    NotifierProvider<ControllerDashboard, EstadoDashboard>(ControllerDashboard.new);
