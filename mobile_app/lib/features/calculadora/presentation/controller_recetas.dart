import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../core/red/resultado.dart';
import '../domain/receta_resumen.dart';
import '../domain/repositorio_calculadora.dart';
import 'estado_recetas.dart';

/// Controller que carga las recetas disponibles para el selector.
class ControllerRecetas extends Notifier<EstadoRecetas> {
  late final RepositorioCalculadora _repositorio;

  @override
  EstadoRecetas build() {
    _repositorio = sl<RepositorioCalculadora>();
    return const EstadoRecetas.cargando();
  }

  Future<void> cargar() async {
    state = const EstadoRecetas.cargando();
    final Resultado<List<RecetaResumen>> resultado = await _repositorio.listarRecetas();
    state = switch (resultado) {
      Exito<List<RecetaResumen>>(:final List<RecetaResumen> valor) => EstadoRecetas.exito(valor),
      Fallo<List<RecetaResumen>>(:final excepcion) => EstadoRecetas.error(excepcion.mensaje),
    };
  }
}

final NotifierProvider<ControllerRecetas, EstadoRecetas> controllerRecetasProvider =
    NotifierProvider<ControllerRecetas, EstadoRecetas>(ControllerRecetas.new);
