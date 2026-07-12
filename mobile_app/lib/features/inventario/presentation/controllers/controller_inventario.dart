import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../../core/red/resultado.dart';
import '../../domain/entidades/insumo.dart';
import '../../domain/repositorio_inventario.dart';
import '../estado/estado_inventario.dart';

/// Controller de la lista de inventario.
class ControllerInventario extends Notifier<EstadoInventario> {
  late final RepositorioInventario _repositorio;

  @override
  EstadoInventario build() {
    _repositorio = sl<RepositorioInventario>();
    return const EstadoInventario.inicial();
  }

  Future<void> cargar() async {
    state = const EstadoInventario.cargando();
    final Resultado<List<Insumo>> resultado = await _repositorio
        .obtenerInventario();
    state = switch (resultado) {
      Exito<List<Insumo>>(:final List<Insumo> valor) => EstadoInventario.exito(
        valor,
      ),
      Fallo<List<Insumo>>(:final excepcion) => EstadoInventario.error(
        excepcion.mensaje,
      ),
    };
  }
}

final NotifierProvider<ControllerInventario, EstadoInventario>
controllerInventarioProvider =
    NotifierProvider<ControllerInventario, EstadoInventario>(
      ControllerInventario.new,
    );
