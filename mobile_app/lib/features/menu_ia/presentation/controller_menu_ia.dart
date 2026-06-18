import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../core/red/resultado.dart';
import '../domain/repositorio_menu_ia.dart';
import '../domain/sugerencia_menu.dart';
import 'estado_menu_ia.dart';

/// Controller de las sugerencias de menú (IA).
class ControllerMenuIa extends Notifier<EstadoMenuIa> {
  late final RepositorioMenuIa _repositorio;

  @override
  EstadoMenuIa build() {
    _repositorio = sl<RepositorioMenuIa>();
    return const EstadoMenuIa.inicial();
  }

  Future<void> cargar() async {
    state = const EstadoMenuIa.cargando();
    final Resultado<List<SugerenciaMenu>> resultado = await _repositorio.obtenerSugerencias();
    state = switch (resultado) {
      Exito<List<SugerenciaMenu>>(:final List<SugerenciaMenu> valor) => EstadoMenuIa.exito(valor),
      Fallo<List<SugerenciaMenu>>(:final excepcion) => EstadoMenuIa.error(excepcion.mensaje),
    };
  }
}

final NotifierProvider<ControllerMenuIa, EstadoMenuIa> controllerMenuIaProvider =
    NotifierProvider<ControllerMenuIa, EstadoMenuIa>(ControllerMenuIa.new);
