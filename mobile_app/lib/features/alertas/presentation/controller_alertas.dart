import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../core/red/resultado.dart';
import '../domain/alerta.dart';
import '../domain/repositorio_alertas.dart';
import 'estado_alertas.dart';

/// Controller de la lista de alertas.
class ControllerAlertas extends Notifier<EstadoAlertas> {
  late final RepositorioAlertas _repositorio;

  @override
  EstadoAlertas build() {
    _repositorio = sl<RepositorioAlertas>();
    return const EstadoAlertas.inicial();
  }

  Future<void> cargar() async {
    state = const EstadoAlertas.cargando();
    final Resultado<List<Alerta>> resultado = await _repositorio
        .obtenerAlertas();
    state = switch (resultado) {
      Exito<List<Alerta>>(:final List<Alerta> valor) => EstadoAlertas.exito(
        valor,
      ),
      Fallo<List<Alerta>>(:final excepcion) => EstadoAlertas.error(
        excepcion.mensaje,
      ),
    };
  }
}

final NotifierProvider<ControllerAlertas, EstadoAlertas>
controllerAlertasProvider = NotifierProvider<ControllerAlertas, EstadoAlertas>(
  ControllerAlertas.new,
);
